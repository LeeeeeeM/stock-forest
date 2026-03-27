package handler

import (
	"net/http"
	"new-apps/backend/internal/model"
	"new-apps/backend/internal/repository"
	"new-apps/backend/internal/service"
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
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
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
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid payload"})
		return
	}
	payload.Code = strings.ToLower(strings.TrimSpace(payload.Code))
	payload.Name = strings.TrimSpace(payload.Name)
	payload.Code = service.NormalizeCodeForQuote(payload.Code)
	payload.Market = service.ClassifyCode(payload.Code)
	if payload.Code == "" || payload.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "code/name required"})
		return
	}
	exists, err := h.repo.Exists(userID, payload.Code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"message": "already in watchlist"})
		return
	}
	item := &model.WatchlistItem{
		UserID: userID,
		Code:   payload.Code,
		Name:   payload.Name,
		Market: payload.Market,
	}
	if err := h.repo.Create(item); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *WatchlistHandler) Delete(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	idRaw := c.Param("id")
	id64, err := strconv.ParseUint(idRaw, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}
	if err := h.repo.DeleteByIDAndUserID(uint(id64), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *WatchlistHandler) Quotes(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	items, err := h.repo.ListByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	codes := make([]string, 0, len(items))
	for _, item := range items {
		codes = append(codes, item.Code)
	}
	quotes, err := h.quoteSvc.BatchQuotes(codes)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, quotes)
}

func (h *WatchlistHandler) Grouped(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	items, err := h.repo.ListByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
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
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	codes := make([]string, 0, len(items))
	for _, item := range items {
		codes = append(codes, item.Code)
	}
	quotes, err := h.quoteSvc.BatchQuotes(codes)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, service.GroupQuotes(quotes))
}
