package handler

import (
	"net/http"
	"strings"

	"new-apps/backend/internal/repository"
	"new-apps/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authSvc         *service.AuthService
	userRepo        *repository.UserRepository
	verificationSvc *service.VerificationService
}

func NewAuthHandler(
	authSvc *service.AuthService,
	userRepo *repository.UserRepository,
	verificationSvc *service.VerificationService,
) *AuthHandler {
	return &AuthHandler{authSvc: authSvc, userRepo: userRepo, verificationSvc: verificationSvc}
}

type registerReq struct {
	Username         string `json:"username"`
	Email            string `json:"email"`
	Password         string `json:"password"`
	VerificationCode string `json:"verificationCode"`
}

type loginReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type sendRegisterCodeReq struct {
	Email string `json:"email"`
}

type sendChangePasswordCodeReq struct {
	Email string `json:"email"`
}

type forgotPasswordReq struct {
	Email            string `json:"email"`
	NewPassword      string `json:"newPassword"`
	VerificationCode string `json:"verificationCode"`
}

type changePasswordReq struct {
	Email            string `json:"email"`
	OldPassword      string `json:"oldPassword"`
	NewPassword      string `json:"newPassword"`
	VerificationCode string `json:"verificationCode"`
}

func (h *AuthHandler) SendRegisterVerificationCode(c *gin.Context) {
	var req sendRegisterCodeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid payload"})
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "email required"})
		return
	}
	if err := h.verificationSvc.SendRegisterCode(req.Email); err != nil {
		if strings.Contains(err.Error(), "发送过于频繁") {
			c.JSON(http.StatusTooManyRequests, gin.H{"message": err.Error()})
			return
		}
		if strings.Contains(err.Error(), "already registered") {
			c.JSON(http.StatusConflict, gin.H{"message": err.Error()})
			return
		}
		if strings.Contains(err.Error(), "邮件未配置") {
			c.JSON(http.StatusServiceUnavailable, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "verification code sent"})
}

func (h *AuthHandler) SendChangePasswordVerificationCode(c *gin.Context) {
	userIDAny, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	userID := userIDAny.(uint)

	var req sendChangePasswordCodeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid payload"})
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "email required"})
		return
	}
	if err := h.verificationSvc.SendChangePasswordCode(userID, req.Email); err != nil {
		if strings.Contains(err.Error(), "发送过于频繁") {
			c.JSON(http.StatusTooManyRequests, gin.H{"message": err.Error()})
			return
		}
		if strings.Contains(err.Error(), "邮件未配置") {
			c.JSON(http.StatusServiceUnavailable, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "verification code sent"})
}

func (h *AuthHandler) SendForgotPasswordVerificationCode(c *gin.Context) {
	var req sendChangePasswordCodeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid payload"})
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "email required"})
		return
	}
	if err := h.verificationSvc.SendForgotPasswordCode(req.Email); err != nil {
		if strings.Contains(err.Error(), "发送过于频繁") {
			c.JSON(http.StatusTooManyRequests, gin.H{"message": err.Error()})
			return
		}
		if strings.Contains(err.Error(), "邮件未配置") {
			c.JSON(http.StatusServiceUnavailable, gin.H{"message": err.Error()})
			return
		}
		if strings.Contains(err.Error(), "user not found") {
			c.JSON(http.StatusNotFound, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "verification code sent"})
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userIDAny, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	userID := userIDAny.(uint)

	var req changePasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid payload"})
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.VerificationCode == "" || req.OldPassword == "" || req.NewPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "email, verification code, old and new password required"})
		return
	}

	u, err := h.userRepo.FindByID(userID)
	if err != nil || u == nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "user not found"})
		return
	}
	if strings.ToLower(strings.TrimSpace(u.Email)) != req.Email {
		c.JSON(http.StatusBadRequest, gin.H{"message": "email does not match account"})
		return
	}

	if err := h.verificationSvc.VerifyAndConsume(req.Email, service.PurposeChangePassword, req.VerificationCode); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	if err := h.authSvc.ChangePassword(userID, req.OldPassword, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "password updated"})
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req forgotPasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid payload"})
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.VerificationCode = strings.TrimSpace(req.VerificationCode)
	if req.Email == "" || req.VerificationCode == "" || req.NewPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "email, verification code and new password required"})
		return
	}
	if err := h.verificationSvc.VerifyAndConsume(req.Email, service.PurposeChangePassword, req.VerificationCode); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	if err := h.authSvc.ResetPasswordByEmail(req.Email, req.NewPassword); err != nil {
		if strings.Contains(err.Error(), "user not found") {
			c.JSON(http.StatusNotFound, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "password updated"})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid payload"})
		return
	}
	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.VerificationCode = strings.TrimSpace(req.VerificationCode)
	if req.Username == "" || req.Email == "" || len(req.Password) < 6 || req.VerificationCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "username, email, password (min 6) and verification code required"})
		return
	}

	byName, err := h.userRepo.FindByUsername(req.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	if byName != nil {
		c.JSON(http.StatusConflict, gin.H{"message": "username already exists"})
		return
	}
	byEmail, err := h.userRepo.FindByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	if byEmail != nil {
		c.JSON(http.StatusConflict, gin.H{"message": "email already exists"})
		return
	}

	if err := h.verificationSvc.VerifyAndConsume(req.Email, service.PurposeRegister, req.VerificationCode); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	user, err := h.authSvc.Register(req.Username, req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid payload"})
		return
	}
	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "username or password invalid"})
		return
	}
	user, accessToken, refreshToken, err := h.authSvc.Login(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"user":         gin.H{"id": user.ID, "username": user.Username, "email": user.Email},
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var payload struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil || payload.RefreshToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid payload"})
		return
	}
	accessToken, err := h.authSvc.Refresh(payload.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"accessToken": accessToken})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userIDAny, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	userID := userIDAny.(uint)
	user, err := h.userRepo.FindByID(userID)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"id": user.ID, "username": user.Username, "email": user.Email})
}
