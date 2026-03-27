package repository

import (
	"new-apps/backend/internal/model"

	"gorm.io/gorm"
)

type WatchlistRepository struct {
	db *gorm.DB
}

func NewWatchlistRepository(db *gorm.DB) *WatchlistRepository {
	return &WatchlistRepository{db: db}
}

func (r *WatchlistRepository) ListByUserID(userID uint) ([]model.WatchlistItem, error) {
	var items []model.WatchlistItem
	err := r.db.Where("user_id = ?", userID).Order("id desc").Find(&items).Error
	return items, err
}

func (r *WatchlistRepository) Create(item *model.WatchlistItem) error {
	return r.db.Create(item).Error
}

func (r *WatchlistRepository) Exists(userID uint, code string) (bool, error) {
	var count int64
	err := r.db.Model(&model.WatchlistItem{}).Where("user_id = ? and code = ?", userID, code).Count(&count).Error
	return count > 0, err
}

func (r *WatchlistRepository) DeleteByIDAndUserID(id uint, userID uint) error {
	return r.db.Where("id = ? and user_id = ?", id, userID).Delete(&model.WatchlistItem{}).Error
}
