import { createUploadthing} from "uploadthing/next"
 
const f = createUploadthing()

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(metadata)
      console.log("file url", file.url)
      return file.url
    }),
}