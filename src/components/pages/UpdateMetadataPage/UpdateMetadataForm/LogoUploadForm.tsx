'use client'

import { useState } from 'react'
import { type UseFormReturn, useWatch } from 'react-hook-form'
import { Upload } from 'lucide-react'
import Image from 'next/image'
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import InfoTooltip from '@/components/common/InfoTooltip'
import { type UpdateMetadataFormData } from './updateMetadataFormSchema'

interface LogoUploadFormProps {
  form: UseFormReturn<UpdateMetadataFormData>
}

export const LogoUploadForm = ({ form }: LogoUploadFormProps): React.ReactNode => {
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const currentLogoUrl = useWatch({ control: form.control, name: 'currentLogoUrl', defaultValue: '' })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, onChange: (file: File | undefined) => void): void => {
    const file = event.target.files?.[0]
    if (file) {
      onChange(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      onChange(undefined)
      setPreviewUrl('')
    }
  }

  const displayUrl = previewUrl || currentLogoUrl

  return (
    <div className='space-y-4'>
      <h3 className='flex items-center space-x-2 text-lg font-medium'>
        <Upload className='text-primary h-5 w-5' />
        <span>Token Logo</span>
      </h3>

      <FormField
        control={form.control}
        name='logo'
        render={({ field: { onChange, name, onBlur } }) => (
          <FormItem>
            <FormLabel className='flex items-center gap-2'>
              <span>Replace Logo (optional)</span>
              <InfoTooltip info_description='Upload a new image to replace the current logo. Leave empty to keep the existing logo unchanged.' />
            </FormLabel>
            <FormControl>
              <div className='relative'>
                <input
                  accept='image/*'
                  className='bg-input-background focus:border-primary hover:border-primary/50 file:bg-primary file:text-primary-foreground file:hover:bg-primary/90 absolute inset-0 h-full w-full cursor-pointer rounded-md border-2 border-dashed opacity-0 file:border-0 file:text-sm file:font-medium'
                  name={name}
                  onBlur={onBlur}
                  onChange={(e) => handleFileUpload(e, onChange)}
                  type='file'
                />
                <div className='bg-input-background hover:border-primary/50 flex h-32 items-center justify-center rounded-md border-2 border-dashed'>
                  {displayUrl ? (
                    <div className='relative h-32 w-32'>
                      <Image
                        alt='Token logo preview'
                        className='rounded-md object-contain'
                        fill
                        sizes='96px'
                        src={displayUrl}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className='text-muted-foreground text-center'>
                      <Upload className='mx-auto h-8 w-8' />
                      <p className='mt-2 text-sm'>Click or drag image to upload</p>
                      <p className='text-xs'>PNG, JPG, GIF up to 2MB</p>
                    </div>
                  )}
                </div>
              </div>
            </FormControl>
            {currentLogoUrl && !previewUrl && <FormDescription>Showing the current logo. Upload an image to replace it.</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
