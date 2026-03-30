package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/LeeeeeeM/stock-forest/backend/internal/i18n"
	"github.com/LeeeeeeM/stock-forest/backend/internal/repository"
	"github.com/LeeeeeeM/stock-forest/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authSvc         *service.AuthService
	userRepo        *repository.UserRepository
	verificationSvc *service.VerificationService
	captchaSvc      *service.CaptchaService
}

func NewAuthHandler(
	authSvc *service.AuthService,
	userRepo *repository.UserRepository,
	verificationSvc *service.VerificationService,
	captchaSvc *service.CaptchaService,
) *AuthHandler {
	return &AuthHandler{
		authSvc:         authSvc,
		userRepo:        userRepo,
		verificationSvc: verificationSvc,
		captchaSvc:      captchaSvc,
	}
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
	Email       string `json:"email"`
	CaptchaID   string `json:"captchaId"`
	CaptchaCode string `json:"captchaCode"`
}

type sendChangePasswordCodeReq struct {
	Email       string `json:"email"`
	CaptchaID   string `json:"captchaId"`
	CaptchaCode string `json:"captchaCode"`
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
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrInvalidPayload)
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrEmailRequired)
		return
	}
	if err := h.captchaSvc.VerifyAndConsume(req.CaptchaID, req.CaptchaCode); err != nil {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrInvalidCaptcha)
		return
	}
	if err := h.verificationSvc.SendRegisterCode(req.Email); err != nil {
		status, code := mapVerificationError(err)
		i18n.ErrorJSON(c, status, code)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "verification code sent"})
}

func (h *AuthHandler) SendChangePasswordVerificationCode(c *gin.Context) {
	userIDAny, ok := c.Get("userID")
	if !ok {
		i18n.ErrorJSON(c, http.StatusUnauthorized, i18n.ErrUnauthorized)
		return
	}
	userID := userIDAny.(uint)

	var req sendChangePasswordCodeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrInvalidPayload)
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrEmailRequired)
		return
	}
	if err := h.captchaSvc.VerifyAndConsume(req.CaptchaID, req.CaptchaCode); err != nil {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrInvalidCaptcha)
		return
	}
	if err := h.verificationSvc.SendChangePasswordCode(userID, req.Email); err != nil {
		status, code := mapVerificationError(err)
		i18n.ErrorJSON(c, status, code)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "verification code sent"})
}

func (h *AuthHandler) SendForgotPasswordVerificationCode(c *gin.Context) {
	var req sendChangePasswordCodeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrInvalidPayload)
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrEmailRequired)
		return
	}
	if err := h.captchaSvc.VerifyAndConsume(req.CaptchaID, req.CaptchaCode); err != nil {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrInvalidCaptcha)
		return
	}
	if err := h.verificationSvc.SendForgotPasswordCode(req.Email); err != nil {
		status, code := mapVerificationError(err)
		i18n.ErrorJSON(c, status, code)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "verification code sent"})
}

func (h *AuthHandler) GetCaptcha(c *gin.Context) {
	id, imageBase64, err := h.captchaSvc.Generate()
	if err != nil {
		i18n.ErrorJSON(c, http.StatusInternalServerError, i18n.ErrGenerateCaptchaFailed)
		return
	}
	imageDataURL := imageBase64
	if !strings.HasPrefix(imageDataURL, "data:image") {
		imageDataURL = "data:image/png;base64," + imageBase64
	} else {
		if parts := strings.SplitN(imageBase64, ",", 2); len(parts) == 2 {
			imageBase64 = parts[1]
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"captchaId":    id,
		"imageBase64":  imageBase64,
		"imageDataUrl": imageDataURL,
	})
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userIDAny, ok := c.Get("userID")
	if !ok {
		i18n.ErrorJSON(c, http.StatusUnauthorized, i18n.ErrUnauthorized)
		return
	}
	userID := userIDAny.(uint)

	var req changePasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrInvalidPayload)
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.VerificationCode == "" || req.OldPassword == "" || req.NewPassword == "" {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrInvalidPayload)
		return
	}

	u, err := h.userRepo.FindByID(userID)
	if err != nil || u == nil {
		i18n.ErrorJSON(c, http.StatusNotFound, i18n.ErrUserNotFound)
		return
	}
	if strings.ToLower(strings.TrimSpace(u.Email)) != req.Email {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrEmailMismatch)
		return
	}

	if err := h.verificationSvc.VerifyAndConsume(req.Email, service.PurposeChangePassword, req.VerificationCode); err != nil {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrVerificationCodeInvalid)
		return
	}

	if err := h.authSvc.ChangePassword(userID, req.OldPassword, req.NewPassword); err != nil {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrPasswordChangeFailed)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "password updated"})
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req forgotPasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrInvalidPayload)
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.VerificationCode = strings.TrimSpace(req.VerificationCode)
	if req.Email == "" || req.VerificationCode == "" || req.NewPassword == "" {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrInvalidPayload)
		return
	}
	if err := h.verificationSvc.VerifyAndConsume(req.Email, service.PurposeChangePassword, req.VerificationCode); err != nil {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrVerificationCodeInvalid)
		return
	}
	if err := h.authSvc.ResetPasswordByEmail(req.Email, req.NewPassword); err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			i18n.ErrorJSON(c, http.StatusNotFound, i18n.ErrUserNotFound)
			return
		}
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrPasswordResetFailed)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "password updated"})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerReq
	if err := c.ShouldBindJSON(&req); err != nil {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrInvalidPayload)
		return
	}
	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.VerificationCode = strings.TrimSpace(req.VerificationCode)
	if req.Username == "" || req.Email == "" || len(req.Password) < 6 || req.VerificationCode == "" {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrInvalidPayload)
		return
	}

	byName, err := h.userRepo.FindByUsername(req.Username)
	if err != nil {
		i18n.ErrorJSON(c, http.StatusInternalServerError, i18n.ErrInternalServerError)
		return
	}
	if byName != nil {
		i18n.ErrorJSON(c, http.StatusConflict, i18n.ErrUsernameExists)
		return
	}
	byEmail, err := h.userRepo.FindByEmail(req.Email)
	if err != nil {
		i18n.ErrorJSON(c, http.StatusInternalServerError, i18n.ErrInternalServerError)
		return
	}
	if byEmail != nil {
		i18n.ErrorJSON(c, http.StatusConflict, i18n.ErrEmailExists)
		return
	}

	if err := h.verificationSvc.VerifyAndConsume(req.Email, service.PurposeRegister, req.VerificationCode); err != nil {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrVerificationCodeInvalid)
		return
	}

	user, err := h.authSvc.Register(req.Username, req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrUsernameAlreadyExists) {
			i18n.ErrorJSON(c, http.StatusConflict, i18n.ErrUsernameExists)
			return
		}
		if errors.Is(err, service.ErrEmailAlreadyExists) {
			i18n.ErrorJSON(c, http.StatusConflict, i18n.ErrEmailExists)
			return
		}
		i18n.ErrorJSON(c, http.StatusConflict, i18n.ErrInternalServerError)
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
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrInvalidPayload)
		return
	}
	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" || req.Password == "" {
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrUsernamePasswordRequired)
		return
	}
	user, accessToken, refreshToken, err := h.authSvc.Login(req.Username, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			i18n.ErrorJSON(c, http.StatusUnauthorized, i18n.ErrInvalidCredentials)
			return
		}
		i18n.ErrorJSON(c, http.StatusUnauthorized, i18n.ErrInternalServerError)
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
		i18n.ErrorJSON(c, http.StatusBadRequest, i18n.ErrInvalidPayload)
		return
	}
	accessToken, err := h.authSvc.Refresh(payload.RefreshToken)
	if err != nil {
		i18n.ErrorJSON(c, http.StatusUnauthorized, i18n.ErrInvalidRefreshToken)
		return
	}
	c.JSON(http.StatusOK, gin.H{"accessToken": accessToken})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userIDAny, ok := c.Get("userID")
	if !ok {
		i18n.ErrorJSON(c, http.StatusUnauthorized, i18n.ErrUnauthorized)
		return
	}
	userID := userIDAny.(uint)
	user, err := h.userRepo.FindByID(userID)
	if err != nil || user == nil {
		i18n.ErrorJSON(c, http.StatusNotFound, i18n.ErrUserNotFound)
		return
	}
	c.JSON(http.StatusOK, gin.H{"id": user.ID, "username": user.Username, "email": user.Email})
}

func mapVerificationError(err error) (int, string) {
	if err == nil {
		return http.StatusInternalServerError, i18n.ErrInternalServerError
	}
	switch {
	case errors.Is(err, service.ErrTooManyRequests):
		return http.StatusTooManyRequests, i18n.ErrTooManyRequests
	case errors.Is(err, service.ErrEmailAlreadyExists):
		return http.StatusConflict, i18n.ErrEmailExists
	case errors.Is(err, service.ErrMailServiceUnavailable):
		return http.StatusServiceUnavailable, i18n.ErrMailServiceUnavailable
	case errors.Is(err, service.ErrUserNotFound):
		return http.StatusNotFound, i18n.ErrUserNotFound
	case errors.Is(err, service.ErrEmailMismatch):
		return http.StatusBadRequest, i18n.ErrEmailMismatch
	case errors.Is(err, service.ErrVerificationCodeInvalid):
		return http.StatusBadRequest, i18n.ErrVerificationCodeInvalid
	default:
		return http.StatusInternalServerError, i18n.ErrInternalServerError
	}
}
