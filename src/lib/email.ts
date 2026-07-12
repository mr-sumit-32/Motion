import emailjs from '@emailjs/browser';

// Replace these with your actual EmailJS credentials
const SERVICE_ID = 'service_kpdaoeo';
const TEMPLATE_ID = 'template_kctxfcj';
const PUBLIC_KEY = 'jC1_xdxcDBDIGZviK';

export const sendTaskNotification = async (
  assigneeEmails: string, 
  taskName: string, 
  assignedBy: string,
  priority: string
) => {
  if (!assigneeEmails) return;

  // Split by comma in case there are multiple assignees, and clean up spaces
  const emails = assigneeEmails.split(',').map(e => e.trim()).filter(Boolean);

  try {
    for (const email of emails) {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          to_email: email,
          task_name: taskName,
          assigned_by: assignedBy,
          priority: priority
        },
        PUBLIC_KEY
      );
    }
    console.log("Notification email(s) sent successfully!");
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
};