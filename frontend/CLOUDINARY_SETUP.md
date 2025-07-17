# Cloudinary Setup Instructions

## 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Navigate to your Dashboard

## 2. Get Your Credentials

From your Cloudinary Dashboard, copy the following:

- **Cloud Name**: Found in your dashboard
- **Upload Preset**: You'll need to create this

## 3. Create an Upload Preset

1. In your Cloudinary Dashboard, go to **Settings** > **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Configure the preset:
   - **Upload preset name**: Choose a name (e.g., `sweet-shop-products`)
   - **Signing Mode**: Select **Unsigned**
   - **Resource Type**: **Image**
   - **Allowed formats**: jpg, png, webp, jpeg
   - **Max file size**: 5MB
   - **Max image width/height**: 1920px (optional)
5. Save the preset

## 4. Update Environment Variables

Update your `.env` file with your Cloudinary credentials:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name_here"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your_upload_preset_name_here"
```

## 5. Features

- ✅ Multiple file upload (max 5 files)
- ✅ File size validation (5MB limit)
- ✅ Image format validation
- ✅ Preview uploaded images
- ✅ Remove uploaded images
- ✅ Loading states
- ✅ Error handling with toast notifications

## 6. Usage

The `CloudinaryUpload` component is already integrated into your admin panel for product image uploads.
