type Props = {
  message: string;
  className?: string;
};

export function FlashMessage({ message, className = '' }: Props) {
  const isError =
    /失败|错误|Bad Request|Unauthorized|Forbidden|Too Many|not found|invalid/i.test(message);
  const isOk =
    /成功|已发送|已修改|重置成功|注册成功|密码已修改|密码重置成功|验证码已发送/i.test(message);
  const variant = isError ? 'lf-flash--error' : isOk ? 'lf-flash--success' : 'lf-flash--info';
  const role = isError ? 'alert' : 'status';

  return (
    <div role={role} className={`lf-flash ${variant} ${className}`.trim()}>
      {message}
    </div>
  );
}
