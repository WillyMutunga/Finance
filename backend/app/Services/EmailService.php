<?php

namespace App\Services;

use App\Database;
use PDO;

class EmailService
{
    private static ?EmailService $instance = null;

    public static function getInstance(): EmailService
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Ensure auth_otps table exists
     */
    public function ensureOtpTable(): void
    {
        try {
            $db = Database::getConnection();
            $db->exec("
                CREATE TABLE IF NOT EXISTS auth_otps (
                    id VARCHAR(64) PRIMARY KEY,
                    school_id VARCHAR(64),
                    user_id VARCHAR(64),
                    identifier VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    otp_code VARCHAR(12) NOT NULL,
                    purpose VARCHAR(50) DEFAULT 'LOGIN_2FA',
                    temp_token VARCHAR(128) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    is_used BOOLEAN DEFAULT FALSE,
                    attempts INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_auth_otps_token ON auth_otps(temp_token);
                CREATE INDEX IF NOT EXISTS idx_auth_otps_identifier ON auth_otps(identifier);
            ");
        } catch (\Throwable $e) {
            error_log("Failed to ensure auth_otps table: " . $e->getMessage());
        }
    }

    /**
     * Dispatch styled HTML email
     */
    public function sendEmail(string $to, string $subject, string $htmlBody, string $schoolName = 'Skysoft Finance ERP'): bool
    {
        $headers = [];
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-type: text/html; charset=UTF-8';
        $headers[] = "From: {$schoolName} <no-reply@nduundune.ac.ke>";
        $headers[] = 'X-Mailer: PHP/' . phpversion();

        // In local development or staging, log email to system temp directory for instant inspection
        $logDir = sys_get_temp_dir() . '/skysoft_emails';
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0777, true);
        }
        $logFile = $logDir . '/email_log_' . date('Y-m-d') . '.log';
        $logEntry = "[" . date('Y-m-d H:i:s') . "] TO: {$to} | SUBJECT: {$subject}\n" . strip_tags($htmlBody) . "\n----------------------------------------\n";
        @file_put_contents($logFile, $logEntry, FILE_APPEND);

        try {
            return @mail($to, $subject, $htmlBody, implode("\r\n", $headers));
        } catch (\Throwable $e) {
            error_log("Mail dispatch error: " . $e->getMessage());
            return true;
        }
    }

    /**
     * Send 2FA Verification OTP Email
     */
    public function send2FAOTPEmail(string $to, string $userName, string $otpCode, int $expiresMinutes = 10, string $schoolName = 'Nduundune Secondary School'): bool
    {
        $subject = "Your 2FA Verification Code: {$otpCode} - {$schoolName}";
        
        $htmlBody = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #0284c7 0%, #059669 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0 0 4px 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
                .header p { margin: 0; font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
                .body-content { padding: 32px 28px; }
                .otp-box { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
                .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #065f46; font-family: monospace; }
                .alert-note { font-size: 12px; color: #64748b; line-height: 1.6; margin-top: 16px; }
                .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>{$schoolName}</h1>
                    <p>Institutional Finance Portal • Security Verification</p>
                </div>
                <div class='body-content'>
                    <p style='font-size: 15px; margin-top: 0;'>Hello <strong>{$userName}</strong>,</p>
                    <p style='font-size: 14px; color: #475569;'>A request was made to authenticate your session into the Institutional Finance Portal. Please use the 6-digit verification code below to complete your sign-in:</p>
                    
                    <div class='otp-box'>
                        <div style='font-size: 11px; font-weight: bold; color: #047857; text-transform: uppercase; margin-bottom: 6px;'>Your One-Time Password (OTP)</div>
                        <div class='otp-code'>{$otpCode}</div>
                        <div style='font-size: 11px; color: #059669; margin-top: 6px;'>Valid for {$expiresMinutes} minutes</div>
                    </div>
                    
                    <div class='alert-note'>
                        <strong>Security Reminder:</strong> Never share this code with anyone. School administrators will never ask for your one-time code. If you did not initiate this login attempt, please notify the school accounts department immediately.
                    </div>
                </div>
                <div class='footer'>
                    &copy; " . date('Y') . " {$schoolName}. Powered by Skysoft Institutional ERP.
                </div>
            </div>
        </body>
        </html>
        ";

        return $this->sendEmail($to, $subject, $htmlBody, $schoolName);
    }

    /**
     * Send Official Receipt Confirmation Email
     */
    public function sendReceiptConfirmationEmail(string $to, array $receiptData, string $schoolName = 'Nduundune Secondary School'): bool
    {
        $receiptNo = $receiptData['receipt_number'] ?? 'Official';
        $amount = number_format((float)($receiptData['amount'] ?? 0), 2);
        $studentName = $receiptData['student_name'] ?? 'Student';
        $admNo = $receiptData['admission_number'] ?? '-';
        $refCode = $receiptData['reference_code'] ?? 'N/A';
        $paymentMode = $receiptData['payment_mode'] ?? 'M-Pesa';

        $subject = "Official Payment Receipt: {$receiptNo} (KES {$amount}) - {$studentName}";

        $htmlBody = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
                .header { background: #065f46; padding: 28px 24px; text-align: center; color: #ffffff; }
                .body-content { padding: 28px; }
                .amount-hero { text-align: center; background: #ecfdf5; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
                .details-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
                .details-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
                .details-table td:last-child { text-align: right; font-weight: bold; }
                .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2 style='margin:0;'>{$schoolName}</h2>
                    <p style='margin:4px 0 0; font-size:12px; text-transform:uppercase;'>Official Fee Payment Receipt</p>
                </div>
                <div class='body-content'>
                    <div class='amount-hero'>
                        <div style='font-size:12px; color:#047857; font-weight:bold; text-transform:uppercase;'>Total Received</div>
                        <div style='font-size:32px; font-weight:900; color:#065f46; font-family:monospace; margin-top:4px;'>KES {$amount}</div>
                    </div>
                    <table class='details-table'>
                        <tr><td style='color:#64748b;'>Receipt Serial:</td><td style='font-family:monospace;'>{$receiptNo}</td></tr>
                        <tr><td style='color:#64748b;'>Student Name:</td><td>{$studentName}</td></tr>
                        <tr><td style='color:#64748b;'>Admission No:</td><td style='font-family:monospace;'>{$admNo}</td></tr>
                        <tr><td style='color:#64748b;'>Payment Channel:</td><td>{$paymentMode}</td></tr>
                        <tr><td style='color:#64748b;'>Transaction Ref:</td><td style='font-family:monospace;'>{$refCode}</td></tr>
                        <tr><td style='color:#64748b;'>Issued Date:</td><td>" . date('d M Y, h:i A') . "</td></tr>
                    </table>
                </div>
                <div class='footer'>
                    Verified System Generated Receipt • &copy; " . date('Y') . " {$schoolName}
                </div>
            </div>
        </body>
        </html>
        ";

        return $this->sendEmail($to, $subject, $htmlBody, $schoolName);
    }
}
