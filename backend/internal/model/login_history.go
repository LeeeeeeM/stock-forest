package model

import "time"

type LoginHistory struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"userId"`
	IP        string    `gorm:"size:64;not null" json:"ip"`
	UserAgent string    `gorm:"size:512;not null" json:"userAgent"`
	CreatedAt time.Time `json:"createdAt"`
}
