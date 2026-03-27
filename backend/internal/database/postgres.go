package database

import (
	"new-apps/backend/internal/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	if err := db.AutoMigrate(&model.User{}); err != nil {
		return nil, err
	}
	if err := db.AutoMigrate(&model.WatchlistItem{}); err != nil {
		return nil, err
	}
	if err := db.AutoMigrate(&model.EmailVerification{}); err != nil {
		return nil, err
	}
	return db, nil
}
