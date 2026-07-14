export const sendTaskNotification = async (
  assigneeEmails: string, 
  taskName: string, 
  assignedBy: string,
  priority: string
) => {
  if (!assigneeEmails) return;

  const emails = assigneeEmails.split(',').map(e => e.trim()).filter(Boolean);

  try {
    for (const email of emails) {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          title: `New Task Assigned: ${taskName}`,
          author: assignedBy.split('@')[0],
          message: `Priority is set to <strong>${priority}</strong>. Please check the workspace for details.`
        }),
      });
    }
    console.log("Nodemailer notification(s) sent successfully!");
  } catch (error) {
    console.error("Failed to send Nodemailer notification:", error);
  }
};

export const sendNoticeNotification = async (
  title: string, 
  message: string, 
  author: string
) => {
  // Replace this with your actual team mailing list email.
  const TEAM_EMAIL_ALIAS = "team-alias@yourcompany.com"; 

  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEAM_EMAIL_ALIAS,
        title: title,
        author: author.split('@')[0],
        message: message
      }),
    });
    console.log('Notice board email broadcasted successfully!');
  } catch (error) {
    console.error('Failed to send notice board email:', error);
  }
};