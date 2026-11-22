/// <reference types="jest" />
declare module '*.sql' {
  const sql: string;
  export default sql;
}
