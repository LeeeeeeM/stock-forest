import { useEffect, useState } from 'react';
import { Button, Input, Modal, message } from 'antd';
import { getCaptcha } from '@/lib/api';
import { resolveApiError } from '@/lib/error-message';
import { useI18n } from '@/i18n/useI18n';

type Props = {
  open: boolean;
  onCancel: () => void;
  onVerify: (payload: { captchaId: string; captchaCode: string }) => Promise<void>;
};

export function CaptchaVerifyModal({ open, onCancel, onVerify }: Props) {
  const [messageApi, contextHolder] = message.useMessage();
  const { t } = useI18n();
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
      messageApi.error(resolveApiError(err, 'error.captchaLoadFailed'));
    }
  };

  useEffect(() => {
    if (open) {
      void refreshCaptcha();
    }
  }, [open]);

  const handleOk = async () => {
    if (!captchaId || !captchaCode.trim()) {
      messageApi.warning(t('error.captchaRequired'));
      return;
    }
    setLoading(true);
    try {
      await onVerify({ captchaId, captchaCode: captchaCode.trim() });
    } catch (err: any) {
      messageApi.error(resolveApiError(err, 'error.captchaVerifyFailed'));
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
        title={t('ui.modal.captcha.title')}
        onCancel={onCancel}
        footer={[
          <Button key="cancel" htmlType="button" onClick={onCancel} disabled={loading}>
            {t('ui.modal.captcha.cancel')}
          </Button>,
          <Button
            key="ok"
            type="primary"
            htmlType="button"
            onClick={() => void handleOk()}
            loading={loading}
          >
            {t('ui.modal.captcha.confirm')}
          </Button>,
        ]}
        destroyOnHidden
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              className="min-w-0 flex-1"
              value={captchaCode}
              onChange={(ev) => setCaptchaCode(ev.target.value)}
              onPressEnter={(ev) => {
                ev.preventDefault();
                void handleOk();
              }}
              placeholder={t('ui.placeholder.captcha')}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => void refreshCaptcha()}
              className="h-12 w-[160px] flex-none overflow-hidden rounded-md border border-slate-700/70 bg-slate-900/70 p-0"
              title="点击刷新图形验证码"
            >
              {captchaImage ? (
                <img src={captchaImage} alt="captcha" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-slate-400">{t('ui.captcha.loading')}</span>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
