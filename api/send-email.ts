import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, title, author, message } = req.body;

    // Configure Nodemailer to securely connect to your Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Construct and send the email
    const info = await transporter.sendMail({
      from: `"Motion System" <${process.env.GMAIL_USER}>`, 
      to: email,
      subject: title,
      html: `
        <div style="font-family: sans-serif; max-w-xl; margin: 0 auto; color: #333;">
          <h2 style="color: #4f46e5;">${title}</h2>
          <p><strong>Assigned By:</strong> ${author}</p>
          <div style="padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 16px 0;">
            ${message}
          </div>
          <a href="https://motion-nine-wheat.vercel.app/" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Open Motion Workspace
          </a>
        </div>
      `,
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Nodemailer Error:", error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}