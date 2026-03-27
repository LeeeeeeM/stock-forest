package service

import (
	"fmt"

	"github.com/resend/resend-go/v3"
)

type MailService struct {
	client *resend.Client
	from   string
}

func NewMailService(apiKey, from string) *MailService {
	if apiKey == "" {
		return &MailService{}
	}
	return &MailService{
		client: resend.NewClient(apiKey),
		from:   from,
	}
}

func (m *MailService) Configured() bool {
	return m != nil && m.client != nil && m.from != ""
}

func (m *MailService) SendHTML(to []string, subject, html string) (string, error) {
	if !m.Configured() {
		return "", fmt.Errorf("mail service not configured: set RESEND_API_KEY and RESEND_FROM_EMAIL (请将 re_xxxxxxxxx 换成真实 Resend API Key)")
	}
	sent, err := m.client.Emails.Send(&resend.SendEmailRequest{
		From:    m.from,
		To:      to,
		Subject: subject,
		Html:    html,
	})
	if err != nil {
		return "", err
	}
	return sent.Id, nil
}
