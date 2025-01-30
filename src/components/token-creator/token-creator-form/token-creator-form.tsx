/* eslint-disable no-console */
'use client'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { CloudUpload, Paperclip } from 'lucide-react'

import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from '../../ui/file-upload'
import TokenCreatorFormSchema from './token-creator-form-schema'

const TokenCreatorForm = (): React.ReactNode => {
  const [files, setFiles] = useState<File[] | null>(null)

  const dropZoneConfig = {
    maxFiles: 1,
    maxSize: 1024 * 1024 * 4,
    multiple: false,
  }
  const form = useForm<z.infer<typeof TokenCreatorFormSchema>>({
    resolver: zodResolver(TokenCreatorFormSchema),
    defaultValues: {
      decimal: 9, // Set default value here
    },
  })

  const onSubmit = (values: z.infer<typeof TokenCreatorFormSchema>): void => {
    try {
      console.log(values)
      toast(
        <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
          <code className='text-white'>{JSON.stringify(values, null, 2)}</code>
        </pre>
      )
    } catch (error) {
      console.error('Form submission error', error)
      toast.error('Failed to submit the form. Please try again.')
    }
  }

  return (
    <Form {...form}>
      <form
        className='mx-auto max-w-5xl space-y-8 rounded-lg bg-card p-10 shadow-lg'
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className='grid grid-cols-12 gap-4'>
          <div className='col-span-12 sm:col-span-6'>
            <FormField
              control={form.control}
              name='token_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <p>
                      Token Name <span className='text-primary'>*</span>
                    </p>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='CryptoForge meme token'
                      type='text'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>Provide name of your token</FormDescription>
                </FormItem>
              )}
            />
          </div>

          <div className='col-span-12 sm:col-span-6'>
            <FormField
              control={form.control}
              name='token_symbol'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <p>
                      Token symbol <span className='text-primary'>*</span>
                    </p>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder='shadcn' type='' {...field} />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Provider ticker symbol of your token
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className='grid grid-cols-12 gap-4'>
          <div className='col-span-12 sm:col-span-6'>
            <FormField
              control={form.control}
              name='decimal'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <p>
                      Decimals <span className='text-primary'>*</span>
                    </p>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)} // Convert to number
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Define fractional token precision (how many decimals)
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>

          <div className='col-span-12 sm:col-span-6'>
            <FormField
              control={form.control}
              name='supply'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <p>
                      Supply <span className='text-primary'>*</span>
                    </p>
                  </FormLabel>
                  <FormControl>
                    <Input
                      onChange={(e) => {
                        // Remove non-digit characters and add space formatting
                        const rawValue = e.target.value.replace(/\D/g, '')
                        field.onChange(rawValue ? Number(rawValue) : '') // Store as number
                      }}
                      placeholder='1 000 000'
                      type='text' // Change to text to remove number arrows
                      value={
                        field.value
                          ? field.value
                              .toString()
                              .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
                          : ''
                      }
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Provide overall supply of your token
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name='logo'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo</FormLabel>
              <FormControl>
                <FileUploader
                  className='relative rounded-lg bg-background p-2'
                  dropzoneOptions={dropZoneConfig}
                  onValueChange={setFiles}
                  value={files}
                >
                  <FileInput
                    className='outline-dashed outline-1 outline-slate-500'
                    id='fileInput'
                  >
                    <div className='flex w-full flex-col items-center justify-center p-8'>
                      <CloudUpload className='size-10 text-gray-500' />
                      <p className='mb-1 text-sm text-gray-500 dark:text-gray-400'>
                        <span className='font-semibold'>Click to upload</span>
                        &nbsp; or drag and drop
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        SVG, PNG, JPG or GIF
                      </p>
                    </div>
                  </FileInput>
                  <FileUploaderContent>
                    {files &&
                      files.length > 0 &&
                      files.map((file, i) => (
                        <FileUploaderItem index={i} key={i}>
                          <Paperclip className='size-4 stroke-current' />
                          <span>{file.name}</span>
                        </FileUploaderItem>
                      ))}
                  </FileUploaderContent>
                </FileUploader>
              </FormControl>
              <FormDescription>Add logo to your token</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <p>
                  Description <span className='text-primary'>*</span>
                </p>
              </FormLabel>
              <FormControl>
                <Textarea
                  className='resize-none'
                  placeholder='Here you can add description about your token'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide description of your token
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='revoke_mint_authority'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
              <div className='space-y-0.5'>
                <FormLabel>Revoke Mint Authority</FormLabel>
                <FormDescription>
                  Prevent additional token supply to increase investors trust
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  aria-readonly
                  checked={field.value}
                  // disabled
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='revoke_freeze_authority'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
              <div className='space-y-0.5'>
                <FormLabel>Revoke Freeze Auhtority</FormLabel>
                <FormDescription>Prevent token freezing.</FormDescription>
              </div>
              <FormControl>
                <Switch
                  aria-readonly
                  checked={field.value}
                  // disabled
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='twitter'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Twitter (X) link</FormLabel>
              <FormControl>
                <Input placeholder='Optional' type='text' {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='telegram'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telegram link</FormLabel>
              <FormControl>
                <Input placeholder='Optional' type='' {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='website'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website link</FormLabel>
              <FormControl>
                <Input placeholder='Optional' type='text' {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit'>Submit</Button>
      </form>
    </Form>
  )
}

export default TokenCreatorForm
