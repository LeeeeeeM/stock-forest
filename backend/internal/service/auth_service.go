package service

import (
	"errors"
	"github.com/LeeeeeeM/stock-forest/backend/internal/model"
	"github.com/LeeeeeeM/stock-forest/backend/internal/repository"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	repo              *repository.UserRepository
	accessSecret      []byte
	refreshSecret     []byte
	accessExpireMin   int
	refreshExpireHour int
}

func NewAuthService(
	repo *repository.UserRepository,
	accessSecret, refreshSecret string,
	accessExpireMin, refreshExpireHour int,
) *AuthService {
	return &AuthService{
		repo:              repo,
		accessSecret:      []byte(accessSecret),
		refreshSecret:     []byte(refreshSecret),
		accessExpireMin:   accessExpireMin,
		refreshExpireHour: refreshExpireHour,
	}
}

func (s *AuthService) Register(username, email, password string) (*model.User, error) {
	existByUsername, err := s.repo.FindByUsername(username)
	if err != nil {
		return nil, err
	}
	if existByUsername != nil {
		return nil, ErrUsernameAlreadyExists
	}

	exist, err := s.repo.FindByEmail(email)
	if err != nil {
		return nil, err
	}
	if exist != nil {
		return nil, ErrEmailAlreadyExists
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	user := &model.User{
		Username:     username,
		Email:        email,
		PasswordHash: string(hash),
	}
	if err := s.repo.Create(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *AuthService) Login(username, password string) (*model.User, string, string, error) {
	user, err := s.repo.FindByUsername(username)
	if err != nil {
		return nil, "", "", err
	}
	if user == nil {
		return nil, "", "", ErrInvalidCredentials
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", "", ErrInvalidCredentials
	}
	accessToken, err := s.signToken(user.ID, s.accessSecret, time.Minute*time.Duration(s.accessExpireMin))
	if err != nil {
		return nil, "", "", err
	}
	refreshToken, err := s.signToken(user.ID, s.refreshSecret, time.Hour*time.Duration(s.refreshExpireHour))
	if err != nil {
		return nil, "", "", err
	}
	return user, accessToken, refreshToken, nil
}

func (s *AuthService) Refresh(refreshToken string) (string, error) {
	userID, err := s.parseToken(refreshToken, s.refreshSecret)
	if err != nil {
		return "", ErrInvalidRefreshToken
	}
	return s.signToken(userID, s.accessSecret, time.Minute*time.Duration(s.accessExpireMin))
}

func (s *AuthService) ParseAccessToken(token string) (uint, error) {
	return s.parseToken(token, s.accessSecret)
}

func (s *AuthService) ChangePassword(userID uint, oldPassword, newPassword string) error {
	if len(newPassword) < 6 {
		return errors.New("new password must be at least 6 characters")
	}
	u, err := s.repo.FindByID(userID)
	if err != nil {
		return err
	}
	if u == nil {
		return ErrUserNotFound
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(oldPassword)); err != nil {
		return errors.New("invalid old password")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	return s.repo.UpdatePasswordHash(userID, string(hash))
}

func (s *AuthService) ResetPasswordByEmail(email, newPassword string) error {
	if len(newPassword) < 6 {
		return errors.New("new password must be at least 6 characters")
	}
	u, err := s.repo.FindByEmail(email)
	if err != nil {
		return err
	}
	if u == nil {
		return ErrUserNotFound
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	return s.repo.UpdatePasswordHash(u.ID, string(hash))
}

func (s *AuthService) signToken(userID uint, secret []byte, expire time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(expire).Unix(),
		"iat": time.Now().Unix(),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(secret)
}

func (s *AuthService) parseToken(token string, secret []byte) (uint, error) {
	claims := jwt.MapClaims{}
	t, err := jwt.ParseWithClaims(token, claims, func(_ *jwt.Token) (any, error) {
		return secret, nil
	})
	if err != nil || !t.Valid {
		return 0, errors.New("invalid token")
	}
	sub, ok := claims["sub"]
	if !ok {
		return 0, errors.New("missing sub")
	}
	switch v := sub.(type) {
	case float64:
		return uint(v), nil
	case int:
		return uint(v), nil
	default:
		return 0, errors.New("invalid sub type")
	}
}
