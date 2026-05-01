import { PART1_QUESTIONS } from './part1.js';import { PART2_QUESTIONS } from './part2.js';import { PART3_QUESTIONS } from './part3.js';import { PART4_QUESTIONS } from './part4.js';import { PART5_QUESTIONS } from './part5.js';import { PART6_QUESTIONS } from './part6.js';import { PART7_QUESTIONS } from './part7.js';
export const inferCategory=(q)=>q.category||(Number(q.part)<=4?'listening':'reading');
export const QUESTION_DATA=[...PART1_QUESTIONS,...PART2_QUESTIONS,...PART3_QUESTIONS,...PART4_QUESTIONS,...PART5_QUESTIONS,...PART6_QUESTIONS,...PART7_QUESTIONS].map(q=>({...q,category:inferCategory(q)}));
export const qMap=Object.fromEntries(QUESTION_DATA.map(q=>[q.id,q]));
export const getQuestionById=(questionId)=>qMap[String(questionId)]||null;
