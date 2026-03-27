package main

import (
	"fmt"
	"log"

	"new-apps/backend/internal/config"
	"new-apps/backend/internal/database"
	"new-apps/backend/internal/model"
	"new-apps/backend/internal/service"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config failed: %v", err)
	}

	db, err := database.Connect(cfg.DSN())
	if err != nil {
		log.Fatalf("connect database failed: %v", err)
	}

	var items []model.WatchlistItem
	if err := db.Find(&items).Error; err != nil {
		log.Fatalf("query watchlist_items failed: %v", err)
	}

	updated := 0
	for _, item := range items {
		newCode := service.NormalizeCodeForQuote(item.Code)
		newMarket := service.ClassifyCode(newCode)
		if newCode == item.Code && newMarket == item.Market {
			continue
		}
		if err := db.Model(&model.WatchlistItem{}).
			Where("id = ?", item.ID).
			Updates(map[string]any{
				"code":   newCode,
				"market": newMarket,
			}).Error; err != nil {
			log.Fatalf("update id=%d failed: %v", item.ID, err)
		}
		updated++
		fmt.Printf("updated id=%d: %s/%s -> %s/%s\n", item.ID, item.Code, item.Market, newCode, newMarket)
	}

	fmt.Printf("done, total=%d, updated=%d\n", len(items), updated)
}

