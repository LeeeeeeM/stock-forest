package service

import (
	"errors"
	"strings"

	"github.com/mojocn/base64Captcha"
)

const (
	captchaHeight   = 48
	captchaWidth    = 160
	captchaLength   = 5
	captchaMaxSkew  = 0.6
	captchaDotCount = 80
)

type CaptchaService struct {
	captcha *base64Captcha.Captcha
}

func NewCaptchaService() *CaptchaService {
	driver := base64Captcha.NewDriverDigit(
		captchaHeight,
		captchaWidth,
		captchaLength,
		captchaMaxSkew,
		captchaDotCount,
	)
	return &CaptchaService{
		captcha: base64Captcha.NewCaptcha(driver, base64Captcha.DefaultMemStore),
	}
}

func (s *CaptchaService) Generate() (id, imageBase64 string, err error) {
	id, imageBase64, _, err = s.captcha.Generate()
	return id, imageBase64, err
}

func (s *CaptchaService) VerifyAndConsume(id, answer string) error {
	id = strings.TrimSpace(id)
	answer = strings.TrimSpace(answer)
	if id == "" || answer == "" {
		return errors.New("captcha id and captcha code required")
	}
	if ok := base64Captcha.DefaultMemStore.Verify(id, answer, true); !ok {
		return errors.New("invalid captcha")
	}
	return nil
}
