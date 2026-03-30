package repository

import (
	"github.com/LeeeeeeM/stock-forest/backend/internal/model"

	"gorm.io/gorm"
)

type LoginHistoryRepository struct {
	db *gorm.DB
}

func NewLoginHistoryRepository(db *gorm.DB) *LoginHistoryRepository {
	return &LoginHistoryRepository{db: db}
}

func (r *LoginHistoryRepository) Create(item *model.LoginHistory) error {
	return r.db.Create(item).Error
}

func (r *LoginHistoryRepository) ListRecentByUserID(userID uint, limit int) ([]model.LoginHistory, error) {
	if limit <= 0 {
		limit = 3
	}
	var items []model.LoginHistory
	err := r.db.
		Where("user_id = ?", userID).
		Order("id desc").
		Limit(limit).
		Find(&items).Error
	return items, err
}
