package handler

import (
	"net/http"
	"github.com/LeeeeeeM/stock-forest/backend/internal/i18n"
	"github.com/LeeeeeeM/stock-forest/backend/internal/service"
	"strings"

	"github.com/gin-gonic/gin"
)

type StockHandler struct {
	quoteSvc *service.QuoteService
}

func NewStockHandler(quoteSvc *service.QuoteService) *StockHandler {
	return &StockHandler{quoteSvc: quoteSvc}
}

func (h *StockHandler) Search(c *gin.Context) {
	q := c.Query("q")
	items, err := h.quoteSvc.Search(q)
	if err != nil {
		i18n.ErrorJSON(c, http.StatusBadGateway, i18n.ErrUpstreamServiceFailed)
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *StockHandler) Quotes(c *gin.Context) {
	codesRaw := c.Query("codes")
	codes := strings.Split(codesRaw, ",")
	items, err := h.quoteSvc.BatchQuotes(codes)
	if err != nil {
		i18n.ErrorJSON(c, http.StatusBadGateway, i18n.ErrUpstreamServiceFailed)
		return
	}
	c.JSON(http.StatusOK, items)
}
