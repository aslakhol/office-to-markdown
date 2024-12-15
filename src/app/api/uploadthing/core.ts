import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  officeUploader: f({
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      maxFileSize: "16MB",
    },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      {
        maxFileSize: "16MB",
      },
    "application/pdf": {
      maxFileSize: "16MB",
    },
  })
    .middleware(async () => {
      // This code runs on your server before upload
      return {}; // This will be available in onUploadComplete as `metadata`
    })
    .onUploadComplete(async ({ file }) => {
      // Return the file URL and any additional data you want to send to the client
      console.log("upload file", file);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
