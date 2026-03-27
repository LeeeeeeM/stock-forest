package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
)

type Quote struct {
	Code      string `json:"code"`
	Market    string `json:"market"`
	Name      string `json:"name"`
	Price     string `json:"price"`
	Open      string `json:"open,omitempty"`
	YestClose string `json:"yestClose,omitempty"`
	High      string `json:"high,omitempty"`
	Low       string `json:"low,omitempty"`
	Volume    string `json:"volume,omitempty"`
	Amount    string `json:"amount,omitempty"`
	Buy1      string `json:"buy1,omitempty"`
	Sell1     string `json:"sell1,omitempty"`
	Percent   string `json:"percent,omitempty"`
	Change    string `json:"change,omitempty"`
	Time      string `json:"time,omitempty"`
}

type SearchItem struct {
	Code   string `json:"code"`
	Name   string `json:"name"`
	Market string `json:"market"`
}

type QuoteService struct {
	client *http.Client
}

type GroupedQuotes struct {
	AStocks  []Quote `json:"aStocks"`
	USStocks []Quote `json:"usStocks"`
	HKStocks []Quote `json:"hkStocks"`
}

func NewQuoteService() *QuoteService {
	return &QuoteService{
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *QuoteService) Search(keyword string) ([]SearchItem, error) {
	q := strings.TrimSpace(keyword)
	if q == "" {
		return []SearchItem{}, nil
	}
	u := "https://proxy.finance.qq.com/ifzqgtimg/appstock/smartbox/search/get?q=" + url.QueryEscape(q)
	req, _ := http.NewRequest(http.MethodGet, u, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0")
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	var parsed struct {
		Data struct {
			Stock [][]string `json:"stock"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return []SearchItem{}, nil
	}
	out := make([]SearchItem, 0, len(parsed.Data.Stock))
	for _, row := range parsed.Data.Stock {
		if len(row) < 4 {
			continue
		}
		normalized := NormalizeCodeForQuote(row[1])
		out = append(out, SearchItem{
			Market: ClassifyCode(normalized),
			Code:   normalized,
			Name:   row[2],
		})
	}
	return out, nil
}

func (s *QuoteService) BatchQuotes(codes []string) ([]Quote, error) {
	if len(codes) == 0 {
		return []Quote{}, nil
	}
	sinaCodes := make([]string, 0)
	hkCodes := make([]string, 0)
	for _, c := range codes {
		code := NormalizeCodeForQuote(c)
		if code == "" {
			continue
		}
		if ClassifyCode(code) == "HK" {
			hkCodes = append(hkCodes, code)
		} else {
			sinaCodes = append(sinaCodes, code)
		}
	}

	out := make([]Quote, 0, len(codes))
	if len(sinaCodes) > 0 {
		qs, err := s.fetchSinaQuotes(sinaCodes)
		if err == nil {
			out = append(out, qs...)
		}
	}
	if len(hkCodes) > 0 {
		qs, err := s.fetchHKQuotes(hkCodes)
		if err == nil {
			out = append(out, qs...)
		}
	}
	return out, nil
}

func GroupQuotes(quotes []Quote) GroupedQuotes {
	g := GroupedQuotes{
		AStocks:  []Quote{},
		USStocks: []Quote{},
		HKStocks: []Quote{},
	}
	for _, q := range quotes {
		switch strings.ToUpper(q.Market) {
		case "HK":
			g.HKStocks = append(g.HKStocks, q)
		case "US":
			g.USStocks = append(g.USStocks, q)
		default:
			g.AStocks = append(g.AStocks, q)
		}
	}
	return g
}

func ClassifyCode(code string) string {
	c := strings.ToLower(strings.TrimSpace(code))
	switch {
	case strings.HasPrefix(c, "hk"):
		return "HK"
	case strings.HasPrefix(c, "sh"), strings.HasPrefix(c, "sz"), strings.HasPrefix(c, "bj"):
		return "A"
	case strings.HasPrefix(c, "usr_"), strings.HasPrefix(c, "gb_"):
		return "US"
	case regexp.MustCompile(`^\d{5}$`).MatchString(c):
		return "HK"
	case regexp.MustCompile(`^\d{6}$`).MatchString(c):
		return "A"
	case regexp.MustCompile(`^[a-z]+(\.[a-z]+)?$`).MatchString(c):
		return "US"
	default:
		return "A"
	}
}

func NormalizeCodeForQuote(code string) string {
	c := strings.ToLower(strings.TrimSpace(code))
	if c == "" {
		return ""
	}

	// Canonicalize prefixed A-share code by leading digit.
	if regexp.MustCompile(`^(sh|sz)\d{6}$`).MatchString(c) {
		digits := c[2:]
		if strings.HasPrefix(digits, "5") || strings.HasPrefix(digits, "6") || strings.HasPrefix(digits, "9") {
			return "sh" + digits
		}
		return "sz" + digits
	}

	// Already normalized for known markets.
	if strings.HasPrefix(c, "sh") || strings.HasPrefix(c, "sz") || strings.HasPrefix(c, "bj") ||
		strings.HasPrefix(c, "hk") || strings.HasPrefix(c, "gb_") || strings.HasPrefix(c, "usr_") {
		return c
	}

	// HK ticker often comes as 5 digits like 01810.
	if regexp.MustCompile(`^\d{5}$`).MatchString(c) {
		return "hk" + c
	}

	// A-share ticker often comes as 6 digits like 600519 / 000001.
	if regexp.MustCompile(`^\d{6}$`).MatchString(c) {
		if strings.HasPrefix(c, "5") || strings.HasPrefix(c, "6") || strings.HasPrefix(c, "9") {
			return "sh" + c
		}
		return "sz" + c
	}

	// US ticker from tencent may come as aapl.oq, convert to gb_aapl for sina.
	if strings.Contains(c, ".") {
		parts := strings.SplitN(c, ".", 2)
		if parts[0] != "" {
			return "gb_" + parts[0]
		}
	}

	// Plain alphabets are treated as US tickers.
	if regexp.MustCompile(`^[a-z]+$`).MatchString(c) {
		return "gb_" + c
	}

	return c
}

func (s *QuoteService) fetchSinaQuotes(codes []string) ([]Quote, error) {
	u := "https://hq.sinajs.cn/list=" + strings.Join(codes, ",")
	req, _ := http.NewRequest(http.MethodGet, u, nil)
	req.Header.Set("Referer", "http://finance.sina.com.cn/")
	req.Header.Set("User-Agent", "Mozilla/5.0")
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	raw := decodeGBK(body)

	re := regexp.MustCompile(`var hq_str_([^=]+)="(.*)";`)
	lines := strings.Split(raw, "\n")
	out := make([]Quote, 0, len(lines))
	for _, line := range lines {
		m := re.FindStringSubmatch(strings.TrimSpace(line))
		if len(m) != 3 {
			continue
		}
		code := strings.ToLower(m[1])
		fields := strings.Split(m[2], ",")
		if len(fields) < 8 {
			continue
		}
		if strings.HasPrefix(code, "usr_") || strings.HasPrefix(code, "gb_") {
			out = append(out, Quote{
				Code:    code,
				Market:  "US",
				Name:    fields[0],
				Price:   fields[1],
				Percent: fields[2],
				Time:    fields[3],
				Change:  fields[4],
				Open:    fields[5],
				High:    fields[6],
				Low:     fields[7],
			})
			continue
		}
		t := ""
		if len(fields) > 31 {
			t = fmt.Sprintf("%s %s", fields[30], fields[31])
		}
		change, percent := calcChangeAndPercent(fields[3], fields[2])
		out = append(out, Quote{
			Code:      code,
			Market:    "A",
			Name:      fields[0],
			Open:      fields[1],
			YestClose: fields[2],
			Price:     fields[3],
			High:      fields[4],
			Low:       fields[5],
			Buy1:      fieldAt(fields, 6),
			Sell1:     fieldAt(fields, 7),
			Volume:    fieldAt(fields, 8),
			Amount:    fieldAt(fields, 9),
			Change:    change,
			Percent:   percent,
			Time:      strings.TrimSpace(t),
		})
	}
	return out, nil
}

func (s *QuoteService) fetchHKQuotes(codes []string) ([]Quote, error) {
	u := "https://qt.gtimg.cn/q=" + strings.Join(codes, ",")
	req, _ := http.NewRequest(http.MethodGet, u, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0")
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	raw := decodeGBK(body)
	lines := strings.Split(raw, ";")
	out := make([]Quote, 0, len(lines))
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "v_") || !strings.Contains(line, "=") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		code := strings.TrimPrefix(parts[0], "v_")
		payload := strings.Trim(parts[1], `"`)
		fields := strings.Split(payload, "~")
		if len(fields) < 38 {
			continue
		}
		out = append(out, Quote{
			Code:      strings.ToLower(code),
			Market:    "HK",
			Name:      fields[1],
			Price:     fields[3],
			YestClose: fields[4],
			Open:      fields[5],
			High:      fields[33],
			Low:       fields[34],
			Buy1:      fieldAt(fields, 9),
			Sell1:     fieldAt(fields, 19),
			Volume:    fieldAt(fields, 36),
			Amount:    fieldAt(fields, 37),
			Time:      fields[30],
			Change:    fields[31],
			Percent:   fields[32],
		})
	}
	return out, nil
}

func decodeGBK(body []byte) string {
	reader := transform.NewReader(bytes.NewReader(body), simplifiedchinese.GBK.NewDecoder())
	decoded, err := io.ReadAll(reader)
	if err != nil {
		return string(body)
	}
	return string(decoded)
}

func fieldAt(fields []string, index int) string {
	if index < 0 || index >= len(fields) {
		return ""
	}
	return fields[index]
}

func calcChangeAndPercent(price, yestClose string) (string, string) {
	p, err1 := strconv.ParseFloat(strings.TrimSpace(price), 64)
	y, err2 := strconv.ParseFloat(strings.TrimSpace(yestClose), 64)
	if err1 != nil || err2 != nil || y == 0 {
		return "", ""
	}
	change := p - y
	percent := (change / y) * 100
	return fmt.Sprintf("%.3f", change), fmt.Sprintf("%.2f", percent)
}
