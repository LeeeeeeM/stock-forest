package i18n

import "strings"

const (
	ErrInvalidPayload           = "ERR_INVALID_PAYLOAD"
	ErrEmailRequired            = "ERR_EMAIL_REQUIRED"
	ErrUnauthorized             = "ERR_UNAUTHORIZED"
	ErrInvalidToken             = "ERR_INVALID_TOKEN"
	ErrInvalidCaptcha           = "ERR_INVALID_CAPTCHA"
	ErrTooManyRequests          = "ERR_TOO_MANY_REQUESTS"
	ErrMailServiceUnavailable   = "ERR_MAIL_SERVICE_UNAVAILABLE"
	ErrUserNotFound             = "ERR_USER_NOT_FOUND"
	ErrEmailMismatch            = "ERR_EMAIL_MISMATCH"
	ErrVerificationCodeInvalid  = "ERR_VERIFICATION_CODE_INVALID"
	ErrUsernameExists           = "ERR_USERNAME_EXISTS"
	ErrEmailExists              = "ERR_EMAIL_EXISTS"
	ErrUsernamePasswordRequired = "ERR_USERNAME_PASSWORD_REQUIRED"
	ErrInvalidCredentials       = "ERR_INVALID_CREDENTIALS"
	ErrInvalidRefreshToken      = "ERR_INVALID_REFRESH_TOKEN"
	ErrPasswordResetFailed      = "ERR_PASSWORD_RESET_FAILED"
	ErrPasswordChangeFailed     = "ERR_PASSWORD_CHANGE_FAILED"
	ErrGenerateCaptchaFailed    = "ERR_GENERATE_CAPTCHA_FAILED"
	ErrInternalServerError      = "ERR_INTERNAL_SERVER_ERROR"
	ErrUpstreamServiceFailed    = "ERR_UPSTREAM_SERVICE_FAILED"
	ErrCodeNameRequired         = "ERR_CODE_NAME_REQUIRED"
	ErrAlreadyInWatchlist       = "ERR_ALREADY_IN_WATCHLIST"
	ErrInvalidID                = "ERR_INVALID_ID"
	ErrMissingToken             = "ERR_MISSING_TOKEN"
)

var messages = map[string]map[string]string{
	"zh-CN": {
		ErrInvalidPayload:           "请求参数错误",
		ErrEmailRequired:            "邮箱不能为空",
		ErrUnauthorized:             "未授权访问",
		ErrInvalidToken:             "登录状态无效，请重新登录",
		ErrInvalidCaptcha:           "图形验证码错误",
		ErrTooManyRequests:          "请求过于频繁，请稍后再试",
		ErrMailServiceUnavailable:   "邮件服务不可用，请稍后重试",
		ErrUserNotFound:             "用户不存在",
		ErrEmailMismatch:            "邮箱与当前账号不匹配",
		ErrVerificationCodeInvalid:  "验证码无效或已过期",
		ErrUsernameExists:           "用户名已存在",
		ErrEmailExists:              "邮箱已存在",
		ErrUsernamePasswordRequired: "用户名或密码不能为空",
		ErrInvalidCredentials:       "用户名或密码错误",
		ErrInvalidRefreshToken:      "刷新令牌无效，请重新登录",
		ErrPasswordResetFailed:      "重置密码失败",
		ErrPasswordChangeFailed:     "修改密码失败",
		ErrGenerateCaptchaFailed:    "生成图形验证码失败",
		ErrInternalServerError:      "服务内部错误，请稍后重试",
		ErrUpstreamServiceFailed:    "上游行情服务异常，请稍后重试",
		ErrCodeNameRequired:         "代码和名称不能为空",
		ErrAlreadyInWatchlist:       "该标的已在自选中",
		ErrInvalidID:                "无效的 ID",
		ErrMissingToken:             "缺少登录令牌",
	},
	"en-US": {
		ErrInvalidPayload:           "Invalid request payload.",
		ErrEmailRequired:            "Email is required.",
		ErrUnauthorized:             "Unauthorized.",
		ErrInvalidToken:             "Invalid session token. Please log in again.",
		ErrInvalidCaptcha:           "Invalid captcha.",
		ErrTooManyRequests:          "Too many requests. Please try again later.",
		ErrMailServiceUnavailable:   "Mail service is unavailable. Please try again later.",
		ErrUserNotFound:             "User not found.",
		ErrEmailMismatch:            "Email does not match the current account.",
		ErrVerificationCodeInvalid:  "Verification code is invalid or expired.",
		ErrUsernameExists:           "Username already exists.",
		ErrEmailExists:              "Email already exists.",
		ErrUsernamePasswordRequired: "Username and password are required.",
		ErrInvalidCredentials:       "Invalid username or password.",
		ErrInvalidRefreshToken:      "Invalid refresh token. Please log in again.",
		ErrPasswordResetFailed:      "Failed to reset password.",
		ErrPasswordChangeFailed:     "Failed to change password.",
		ErrGenerateCaptchaFailed:    "Failed to generate captcha.",
		ErrInternalServerError:      "Internal server error. Please try again later.",
		ErrUpstreamServiceFailed:    "Upstream quote service failed. Please try again later.",
		ErrCodeNameRequired:         "Code and name are required.",
		ErrAlreadyInWatchlist:       "The symbol is already in watchlist.",
		ErrInvalidID:                "Invalid ID.",
		ErrMissingToken:             "Missing access token.",
	},
}

func ResolveLanguage(acceptLanguage string) string {
	l := strings.ToLower(strings.TrimSpace(acceptLanguage))
	if strings.HasPrefix(l, "zh") {
		return "zh-CN"
	}
	return "en-US"
}

func Message(lang, code string) string {
	if m, ok := messages[lang][code]; ok {
		return m
	}
	if m, ok := messages["en-US"][code]; ok {
		return m
	}
	return code
}
