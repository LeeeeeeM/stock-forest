package service

import "errors"

var (
	ErrUsernameAlreadyExists   = errors.New("username already exists")
	ErrEmailAlreadyExists      = errors.New("email already exists")
	ErrInvalidCredentials      = errors.New("invalid credentials")
	ErrInvalidRefreshToken     = errors.New("invalid refresh token")
	ErrUserNotFound            = errors.New("user not found")
	ErrEmailMismatch           = errors.New("email does not match account")
	ErrVerificationCodeInvalid = errors.New("invalid or expired verification code")
	ErrTooManyRequests         = errors.New("too many requests")
	ErrMailServiceUnavailable  = errors.New("mail service unavailable")
	ErrEmailRequired           = errors.New("email required")
)

