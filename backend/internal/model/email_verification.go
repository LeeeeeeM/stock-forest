package model

import "time"

// EmailVerification 邮箱验证码（注册 / 修改密码）
type EmailVerification struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	Email     string     `gorm:"size:191;not null;index:idx_email_purpose,priority:1" json:"email"`
	Purpose   string     `gorm:"size:32;not null;index:idx_email_purpose,priority:2" json:"purpose"`
	CodeHash  string     `gorm:"size:255;not null" json:"-"`
	ExpiresAt time.Time  `gorm:"not null" json:"expiresAt"`
	UsedAt    *time.Time `json:"usedAt,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
}
