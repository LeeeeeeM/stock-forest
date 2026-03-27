import { useEffect, useState } from 'react';
import { Button, Input, Modal, message } from 'antd';
import { getCaptcha } from '@/lib/api';

type Props = {
  open: boolean;
  onCancel: () => void;
  onVerify: (payload: { captchaId: string; captchaCode: string }) => Promise<void>;
};

export function CaptchaVerifyModal({ open, onCancel, onVerify }: Props) {
  const [messageApi, contextHolder] = message.useMessage();
  const [captchaId, setCaptchaId] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshCaptcha = async () => {
    try {
      const data = await getCaptcha();
      setCaptchaId(data.captchaId);
      setCaptchaImage(data.imageDataUrl);
      setCaptchaCode('');
    } catch (err: any) {
      messageApi.error(`加载图形验证码失败: ${err?.response?.data?.message ?? err.message}`);
    }
  };

  useEffect(() => {
    if (open) {
      void refreshCaptcha();
    }
  }, [open]);

  const handleOk = async () => {
    if (!captchaId || !captchaCode.trim()) {
      messageApi.warning('请输入图形验证码');
      return;
    }
    setLoading(true);
    try {
      await onVerify({ captchaId, captchaCode: captchaCode.trim() });
    } catch (err: any) {
      messageApi.error(err?.response?.data?.message ?? err.message ?? '验证失败，请重试');
      await refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        title="请完成人机验证"
        onCancel={onCancel}
        footer={[
          <Button key="cancel" htmlType="button" onClick={onCancel} disabled={loading}>
            取消
          </Button>,
          <Button
            key="ok"
            type="primary"
            htmlType="button"
            onClick={() => void handleOk()}
            loading={loading}
          >
            验证并发送
          </Button>,
        ]}
        destroyOnHidden
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={captchaCode}
              onChange={(ev) => setCaptchaCode(ev.target.value)}
              onPressEnter={(ev) => {
                ev.preventDefault();
                void handleOk();
              }}
              placeholder="请输入图片中的字符"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => void refreshCaptcha()}
              className="h-10 overflow-hidden rounded-md border border-slate-700/70 bg-slate-900/70 px-2"
              title="点击刷新图形验证码"
            >
              {captchaImage ? (
                <img src={captchaImage} alt="captcha" className="h-full w-[120px] object-cover" />
              ) : (
                <span className="text-xs text-slate-400">加载中</span>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
