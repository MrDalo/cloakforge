/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { cn } from '@/lib/utils'
import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useFormContext } from 'react-hook-form'
import Image from 'next/image'

const acceptInputFileTypes = {
	'image/png': ['.png'],
	'image/jpeg': ['.jpg', '.jpeg'],
	'image/avif': ['.avif'],
	'image/webp': ['.webp'],
	'image/gif': ['.gif'], // Added GIF support
}

type Props = {
	name: string
}

const FileInputDropZone = ({ name }: Props): React.ReactNode => {
	const {
		register,
		unregister,
		watch,
		setValue,
		formState: { errors },
	} = useFormContext()
	const file: File | undefined = watch(name) // Watch the file field
	const [filePreview, setFilePreview] = useState<string | null>(null)

	const onDrop = useCallback(
		(acceptedFiles: File[], rejectedFiles: any) => {
			if (rejectedFiles.length > 0) {
				setValue(name, null, { shouldValidate: true })
				return
			}

			const selectedFile = acceptedFiles[0]
			if (selectedFile) {
				setValue(name, selectedFile, { shouldValidate: true })
				const newPreview = URL.createObjectURL(selectedFile)
				setFilePreview(newPreview)
			}
		},
		[setValue, name]
	)

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		maxFiles: 1,
		onDrop,
		accept: acceptInputFileTypes,
		maxSize: 5000000, // 5MB
		multiple: false,
	})

	useEffect(() => {
		register(name, { required: 'File is required' })
		return (): void => unregister(name)
	}, [register, unregister, name])

	useEffect(() => {
		if (file) {
			setFilePreview(URL.createObjectURL(file))
		}
	}, [file])

	return (
		<div
			{...getRootProps()}
			className={cn(
				'border-secondary-gray focus:border-secondary-purple group bg-card relative flex aspect-square w-1/2 max-w-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition'
			)}
		>
			<input
				id={name}
				{...getInputProps()}
				className='black-input-autofill text-foreground w-full appearance-none rounded-2xl border px-3 py-2 leading-tight shadow-sm focus:outline-hidden'
			/>
			<div className='text-secondary-gray w-full px-4'>
				{filePreview ? (
					<div className='aspect-square w-full'>
						<Image alt='preview image' className='rounded-2xl object-cover' fill src={filePreview} />
					</div>
				) : isDragActive ? (
					<p className='text-center text-sm'>Drop the file here ...</p>
				) : (
					<p className='text-center text-sm'>
						Drag &apos;n&apos; drop a file here <br /> or
						<span className='font-bold'> click</span> to select a file
					</p>
				)}
				{errors[name] && <p className='text-destructive-foreground text-center'>{errors[name]?.message as React.ReactNode}</p>}
			</div>
		</div>
	)
}

export default FileInputDropZone
