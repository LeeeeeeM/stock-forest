package handler

import (
	"net/http"
	"github.com/LeeeeeeM/stock-forest/backend/internal/i18n"
	"github.com/LeeeeeeM/stock-forest/backend/internal/model"
	"github.com/LeeeeeeM/stock-forest/backend/internal/repository"
	"github.com/LeeeeeeM/stock-forest/backend/internal/service"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type WatchlistHandler struct {
	repo     *repository.WatchlistRepository
	quoteSvc *service.QuoteService
}

func NewWatchlistHandler(repo *repository.WatchlistRepository, quoteSvc *service.QuoteService) *WatchlistHandler {
	return &WatchlistHandler{repo: repo, quoteSvc: quoteSvc}
}

func (h *WatchlistHandler) List(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	items, err := h.repo.ListByUserID(userID)
	if err != nil {
		i18n.ErrorJSON(c, http.StatusInternalServerError, i18n.ErrInternalServerError)
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *WatchlistHandler) Create(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var payload struct {
		Code   string `json:"code"`
		Name   string `json:"name"`
		Market string `json:"market"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrInvalidPayload)
		return
	}
	payload.Code = strings.ToLower(strings.TrimSpace(payload.Code))
	payload.Name = strings.TrimSpace(payload.Name)
	payload.Code = service.NormalizeCodeForQuote(payload.Code)
	payload.Market = service.ClassifyCode(payload.Code)
	if payload.Code == "" || payload.Name == "" {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrCodeNameRequired)
		return
	}
	exists, err := h.repo.Exists(userID, payload.Code)
	if err != nil {
		i18n.ErrorJSON(c, http.StatusInternalServerError, i18n.ErrInternalServerError)
		return
	}
	if exists {
		i18n.ErrorJSON(c, http.StatusConflict, i18n.ErrAlreadyInWatchlist)
		return
	}
	item := &model.WatchlistItem{
		UserID: userID,
		Code:   payload.Code,
		Name:   payload.Name,
		Market: payload.Market,
	}
	if err := h.repo.Create(item); err != nil {
		i18n.ErrorJSON(c, http.StatusInternalServerError, i18n.ErrInternalServerError)
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *WatchlistHandler) Delete(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	idRaw := c.Param("id")
	id64, err := strconv.ParseUint(idRaw, 10, 32)
	if err != nil {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrInvalidID)
		return
	}
	if err := h.repo.DeleteByIDAndUserID(uint(id64), userID); err != nil {
		i18n.ErrorJSON(c, http.StatusInternalServerError, i18n.ErrInternalServerError)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *WatchlistHandler) Quotes(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	items, err := h.repo.ListByUserID(userID)
	if err != nil {
		i18n.ErrorJSON(c, http.StatusInternalServerError, i18n.ErrInternalServerError)
		return
	}
	codes := make([]string, 0, len(items))
	for _, item := range items {
		codes = append(codes, item.Code)
	}
	quotes, err := h.quoteSvc.BatchQuotes(codes)
	if err != nil {
		i18n.ErrorJSON(c, http.StatusBadGateway, i18n.ErrUpstreamServiceFailed)
		return
	}
	c.JSON(http.StatusOK, quotes)
}

func (h *WatchlistHandler) Grouped(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	items, err := h.repo.ListByUserID(userID)
	if err != nil {
		i18n.ErrorJSON(c, http.StatusInternalServerError, i18n.ErrInternalServerError)
		return
	}
	grouped := map[string][]model.WatchlistItem{
		"aStocks":  {},
		"usStocks": {},
		"hkStocks": {},
	}
	for _, item := range items {
		switch strings.ToUpper(item.Market) {
		case "HK":
			grouped["hkStocks"] = append(grouped["hkStocks"], item)
		case "US":
			grouped["usStocks"] = append(grouped["usStocks"], item)
		default:
			grouped["aStocks"] = append(grouped["aStocks"], item)
		}
	}
	c.JSON(http.StatusOK, grouped)
}

func (h *WatchlistHandler) GroupedQuotes(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	items, err := h.repo.ListByUserID(userID)
	if err != nil {
		i18n.ErrorJSON(c, http.StatusInternalServerError, i18n.ErrInternalServerError)
		return
	}
	codes := make([]string, 0, len(items))
	for _, item := range items {
		codes = append(codes, item.Code)
	}
	quotes, err := h.quoteSvc.BatchQuotes(codes)
	if err != nil {
		i18n.ErrorJSON(c, http.StatusBadGateway, i18n.ErrUpstreamServiceFailed)
		return
	}
	c.JSON(http.StatusOK, service.GroupQuotes(quotes))
}
