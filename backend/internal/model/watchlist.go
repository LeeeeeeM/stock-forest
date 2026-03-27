package model

import "time"

type WatchlistItem struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"userId"`
	Code      string    `gorm:"size:64;not null" json:"code"`
	Name      string    `gorm:"size:191;not null" json:"name"`
	Market    string    `gorm:"size:32;not null" json:"market"`
	CreatedAt time.Time `json:"createdAt"`
}
