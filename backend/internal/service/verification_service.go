package service

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"github.com/LeeeeeeM/stock-forest/backend/internal/model"
	"github.com/LeeeeeeM/stock-forest/backend/internal/repository"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

const (
	PurposeRegister        = "register"
	PurposeChangePassword  = "change_password"
	codeTTL                = 10 * time.Minute
	sendCooldown           = 60 * time.Second
	verificationCodeDigits = 6
)

type VerificationService struct {
	mail     *MailService
	evRepo   *repository.EmailVerificationRepository
	userRepo *repository.UserRepository
}

func NewVerificationService(
	mail *MailService,
	evRepo *repository.EmailVerificationRepository,
	userRepo *repository.UserRepository,
) *VerificationService {
	return &VerificationService{mail: mail, evRepo: evRepo, userRepo: userRepo}
}

func (s *VerificationService) SendRegisterCode(email string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return errors.New("email required")
	}
	u, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return err
	}
	if u != nil {
		return errors.New("email already registered")
	}
	return s.sendCode(email, PurposeRegister, "注册验证码", "您正在注册账号，验证码为：")
}

func (s *VerificationService) SendChangePasswordCode(userID uint, email string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return errors.New("email required")
	}
	u, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if u == nil {
		return errors.New("user not found")
	}
	if strings.ToLower(strings.TrimSpace(u.Email)) != email {
		return errors.New("email does not match account")
	}
	return s.sendCode(email, PurposeChangePassword, "修改密码验证码", "您正在修改登录密码，验证码为：")
}

func (s *VerificationService) SendForgotPasswordCode(email string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return errors.New("email required")
	}
	u, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return err
	}
	if u == nil {
		return errors.New("user not found")
	}
	return s.sendCode(email, PurposeChangePassword, "重置密码验证码", "您正在重置登录密码，验证码为：")
}

func (s *VerificationService) sendCode(email, purpose, subject, intro string) error {
	if !s.mail.Configured() {
		return errors.New("邮件未配置：请设置环境变量 RESEND_API_KEY（将 re_xxxxxxxxx 换成真实 Key）和 RESEND_FROM_EMAIL")
	}
	lastAt, ok, err := s.evRepo.LastCreatedAt(email, purpose)
	if err != nil {
		return err
	}
	if ok && time.Since(lastAt) < sendCooldown {
		wait := sendCooldown - time.Since(lastAt)
		sec := int(wait.Seconds()) + 1
		if sec < 1 {
			sec = 1
		}
		return fmt.Errorf("发送过于频繁，请 %d 秒后再试", sec)
	}
	plain, err := randomDigits(verificationCodeDigits)
	if err != nil {
		return err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	rec := &model.EmailVerification{
		Email:     email,
		Purpose:   purpose,
		CodeHash:  string(hash),
		ExpiresAt: time.Now().Add(codeTTL),
	}
	if err := s.evRepo.Create(rec); err != nil {
		return err
	}
	html := fmt.Sprintf("<p>%s</p><p style=\"font-size:24px;font-weight:bold;letter-spacing:4px;\">%s</p><p>验证码 %d 分钟内有效，请勿泄露给他人。</p>", intro, plain, int(codeTTL.Minutes()))
	if _, err := s.mail.SendHTML([]string{email}, subject, html); err != nil {
		_ = s.evRepo.DeleteByID(rec.ID)
		return err
	}
	return nil
}

func (s *VerificationService) VerifyAndConsume(email, purpose, plainCode string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	plainCode = strings.TrimSpace(plainCode)
	if email == "" || plainCode == "" {
		return errors.New("email and verification code required")
	}
	v, err := s.evRepo.FindLatestUnused(email, purpose)
	if err != nil {
		return err
	}
	if v == nil {
		return errors.New("invalid or expired verification code")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(v.CodeHash), []byte(plainCode)); err != nil {
		return errors.New("invalid or expired verification code")
	}
	return s.evRepo.MarkUsed(v.ID)
}

func randomDigits(n int) (string, error) {
	const digits = "0123456789"
	b := make([]byte, n)
	for i := range b {
		idx, err := rand.Int(rand.Reader, big.NewInt(int64(len(digits))))
		if err != nil {
			return "", err
		}
		b[i] = digits[idx.Int64()]
	}
	return string(b), nil
}
