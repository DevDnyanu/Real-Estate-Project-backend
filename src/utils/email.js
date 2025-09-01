// server/src/utils/email.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * sendOTPEmail(email, otp)
 * returns { success: boolean, message: string }
 */
export const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Password Reset OTP",
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Use the following OTP:</p>
        <h3 style="color:blue;">${otp}</h3>
        <p><b>Note:</b> This OTP is valid for <strong>1 hour</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br/>
        <p>Best Regards,<br/>Your Company Support Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: "OTP email sent successfully" };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return { success: false, message: "Failed to send OTP email" };
  }
};
