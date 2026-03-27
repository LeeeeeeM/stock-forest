package model

import "time"

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"size:64;uniqueIndex;not null" json:"username"`
	Email        string    `gorm:"size:191;uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}
