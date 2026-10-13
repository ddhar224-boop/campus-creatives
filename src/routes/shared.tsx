import {createFileRoute} from '@tanstack/react-router';
import {Sessions} from './sessions';
import {pageHead} from '@/lib/page-head';
export const Route=createFileRoute('/shared')({head:()=>pageHead('Shared sessions','Read-only access to classroom teams shared with your account.'),component:()=> <Sessions shared/>});