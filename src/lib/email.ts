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
  // Add this right below your existing sendTaskNotification function

  export const sendNoticeNotification = async (
    title: string, 
    message: string, 
    author: string
  ) => {
    // To protect your free quota, send company-wide notices to a single group email alias!
    // Replace this with your actual team mailing list email.
    const TEAM_EMAIL_ALIAS = "team-alias@yourcompany.com"; 

    const templateParams = {  
      to_email: TEAM_EMAIL_ALIAS,
      title: title,
      message: message,
      author: author.split('@')[0], // Cleans up "sumit@company.com" to just "sumit"
    };

    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_NOTICE_TEMPLATE_ID, // Uses the new Template ID
        templateParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
      console.log('Notice board email broadcasted successfully!');
    } catch (error) {
      console.error('Failed to send notice board email:', error);
    }
  };