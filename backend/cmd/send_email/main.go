package main

import (
	"log"
	"os"

	"github.com/resend/resend-go/v3"
)

func main() {
	// 请将 re_xxxxxxxxx 替换成你的真实 Resend API Key，
	// 更推荐通过环境变量 RESEND_API_KEY 传入。
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		apiKey = "re_xxxxxxxxx"
	}
	if apiKey == "re_xxxxxxxxx" {
		log.Fatal("请先将 re_xxxxxxxxx 替换成真实 API Key（或设置环境变量 RESEND_API_KEY）")
	}

	client := resend.NewClient(apiKey)

	params := &resend.SendEmailRequest{
		From:    "onboarding@resend.dev",
		To:      []string{"wuyutongling@gmail.com"},
		Subject: "Hello World",
		Html:    "<p>Congrats on sending your <strong>first email</strong>!</p>",
	}

	sent, err := client.Emails.Send(params)
	if err != nil {
		log.Fatalf("failed to send email: %v", err)
	}

	log.Printf("email sent: %s", sent.Id)
}

