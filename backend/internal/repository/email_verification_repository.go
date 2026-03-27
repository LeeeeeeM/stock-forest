package repository

import (
	"errors"
	"github.com/LeeeeeeM/stock-forest/backend/internal/model"
	"time"

	"gorm.io/gorm"
)

type EmailVerificationRepository struct {
	db *gorm.DB
}

func NewEmailVerificationRepository(db *gorm.DB) *EmailVerificationRepository {
	return &EmailVerificationRepository{db: db}
}

func (r *EmailVerificationRepository) Create(v *model.EmailVerification) error {
	return r.db.Create(v).Error
}

func (r *EmailVerificationRepository) FindLatestUnused(email, purpose string) (*model.EmailVerification, error) {
	var v model.EmailVerification
	err := r.db.Where("email = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?", email, purpose, time.Now()).
		Order("id DESC").
		First(&v).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &v, nil
}

func (r *EmailVerificationRepository) MarkUsed(id uint) error {
	now := time.Now()
	return r.db.Model(&model.EmailVerification{}).Where("id = ?", id).Update("used_at", now).Error
}

func (r *EmailVerificationRepository) DeleteByID(id uint) error {
	return r.db.Delete(&model.EmailVerification{}, id).Error
}

func (r *EmailVerificationRepository) LastCreatedAt(email, purpose string) (time.Time, bool, error) {
	var v model.EmailVerification
	err := r.db.Where("email = ? AND purpose = ?", email, purpose).
		Order("id DESC").
		First(&v).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return time.Time{}, false, nil
		}
		return time.Time{}, false, err
	}
	return v.CreatedAt, true, nil
}
