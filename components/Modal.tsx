'use client';
import {useEffect,useRef} from 'react';
export default function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close()},[]);return <dialog ref={ref} aria-labelledby="modal-title" onCancel={onClose}><header><h2 id="modal-title">{title}</h2><button aria-label="Close dialog" onClick={onClose}>×</button></header>{children}</dialog>;}
