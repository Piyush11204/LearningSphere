const Contact = require('../models/Contact');
const { sendEmail } = require('../config/nodemailer');

// Submit contact form
const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message, category } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Create contact submission
    const contact = new Contact({
      name,
      email,
      subject,
      message,
      category: category || 'general'
    });

    await contact.save();

    // Send confirmation email to user
    const userEmailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Thank you for contacting Growora!</h2>
        <p>Dear ${name},</p>
        <p>We've received your message and will get back to you within 24 hours.</p>
        
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Message Details:</h3>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Message:</strong><br>${message}</p>
        </div>

        <p>If you have any urgent questions, feel free to call us at +1 (555) 123-4567 or use our live chat feature.</p>
        
        <p>Best regards,<br>
        The Growora Support Team</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6B7280; font-size: 12px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;

    try {
      await sendEmail({
        to: email,
        subject: 'Thank you for contacting Growora',
        html: userEmailTemplate
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Send notification email to admin
    const adminEmailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">New Contact Form Submission</h2>
        
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Contact Details:</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Message:</strong><br>${message}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <p><a href="${process.env.FRONTEND_URL}/admin/contacts" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin Panel</a></p>
      </div>
    `;

    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@growora.com',
        subject: `New Contact Form: ${subject}`,
        html: adminEmailTemplate
      });
    } catch (emailError) {
      console.error('Error sending admin notification:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully',
      data: {
        id: contact._id,
        status: 'submitted'
      }
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form'
    });
  }
};

// Get all contacts (Admin only)
const getAllContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const category = req.query.category;
    const priority = req.query.priority;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const skip = (page - 1) * limit;

    const contacts = await Contact.find(filter)
      .populate('assignedTo', 'firstName lastName email')
      .populate('adminNotes.addedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Contact.countDocuments(filter);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts'
    });
  }
};

// Get contact by ID (Admin only)
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('adminNotes.addedBy', 'firstName lastName');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: contact
    });

  } catch (error) {
    console.error('Get contact by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact'
    });
  }
};

// Update contact status/priority (Admin only)
const updateContact = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;
    const contactId = req.params.id;

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedAt = new Date();
      }
    }
    if (priority) updateData.priority = priority;
    
    // Handle assignedTo field - only set if not empty string
    if (assignedTo !== undefined) {
      if (assignedTo === '' || assignedTo === null) {
        updateData.assignedTo = null; // Set to null instead of empty string
      } else {
        updateData.assignedTo = assignedTo;
      }
    }

    const contact = await Contact.findByIdAndUpdate(
      contactId,
      updateData,
      { new: true }
    ).populate('assignedTo', 'firstName lastName email');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: contact
    });

  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact'
    });
  }
};

// Add admin note to contact
const addAdminNote = async (req, res) => {
  try {
    const { note } = req.body;
    const contactId = req.params.id;

    if (!note || note.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      contactId,
      {
        $push: {
          adminNotes: {
            note: note.trim(),
            addedBy: req.user.id,
            addedAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('adminNotes.addedBy', 'firstName lastName');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Note added successfully',
      data: contact
    });

  } catch (error) {
    console.error('Add admin note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note'
    });
  }
};

// Delete contact (Admin only)
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });

  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact'
    });
  }
};

// Get contact statistics (Admin only)
const getContactStats = async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          new: {
            $sum: {
              $cond: [{ $eq: ['$status', 'new'] }, 1, 0]
            }
          },
          inProgress: {
            $sum: {
              $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0]
            }
          },
          resolved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
            }
          },
          closed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'closed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const categoryStats = await Contact.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Contact.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email subject category status createdAt');

    res.json({
      success: true,
      data: {
        overview: stats[0] || { total: 0, new: 0, inProgress: 0, resolved: 0, closed: 0 },
        byCategory: categoryStats,
        byPriority: priorityStats,
        recent: recentContacts
      }
    });

  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact statistics'
    });
  }
};

module.exports = {
  submitContact,
  getAllContacts,
  getContactById,
  updateContact,
  addAdminNote,
  deleteContact,
  getContactStats
};