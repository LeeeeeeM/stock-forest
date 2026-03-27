import { Button, type ButtonProps } from 'antd';

export type SendCodeButtonProps = Omit<ButtonProps, 'type'>;

export function SendCodeButton({ className = '', ...props }: SendCodeButtonProps) {
  return <Button type="default" className={`lf-btn-send-code ${className}`.trim()} {...props} />;
}
