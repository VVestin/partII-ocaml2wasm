%lex

/*op-char ("!"|"$"|"%"|"&"|"*"|"+"|"-"|"."|"/"|":"|"<"|"="|">"|"?"|"@"|"^"|"|"|"~")*/
%%
\s+                        /* skip whitespace */
"-"?[0-9][0-9_]*("."[0-9_]+)(("e"|"E")("+"|"-")?[0-9][0-9_]*)?
                           return 'FLOAT_LITERAL';
"-"?[0-9][0-9_]*           return 'INT_LITERAL';
"true"|"false"             return 'BOOL_LITERAL'
"->"                       return '->';
","                        return ',';
"+""."?                    return '+';
"-""."?                    return '-';
"*""."?                    return '*';
"/""."?                    return '/';
"<="                       return '<=';
"<"                        return '<';
">="                       return '>=';
">"                        return '>';
"!="                       return '!=';
"="                        return '=';
"("                        return '(';
")"                        return ')';
"&&"                       return '&&';
"||"                       return '||';
"if"                       return 'if';
"then"                     return 'then';
"else"                     return 'else';
"let"                      return 'let';
"rec"                      return 'rec';
"in"                       return 'in';
"end"                      return 'end';
"fun"                      return 'fun';
[a-zA-Z_][a-zA-Z_0-9']*    return 'ident';

/lex

%nonassoc 'in' 'fun'
%left '||'
%left '&&'
%right '<' '<=' '>' '>=' '=' '!='
%left '+' '-'
%left '*' '/'
%left UMINUS
%left APP

%start start

%%

start: expr {return $1};

expr:
   if-expr
 | 'fun' pattern '->' expr
      {$$ = {tokenName: 'FUNC', param: $2, body: $4}}
 | 'let' let-binding 'in' expr
      {$$ = {tokenName: 'LET', rec: false, binding: $2, body: $4}}
 | 'let' 'rec' let-binding 'in' expr
      {$$ = {tokenName: 'LET', rec: true, binding: $3, body: $5}}
   ;

if-expr:
   tuple-expr
 | 'if' if-expr 'then' if-expr 'else' or-expr
      {$$ = {tokenName: 'IF', cond: $2, then: $4, else: $6}}
   ;

tuple-expr:
   or-expr
 | tuple-expr ',' or-expr
      {$$ = {
         tokenName: 'TUPLE',
         exprs: $1.tokenName == 'TUPLE' ? $1.exprs.concat($3) : [$1, $3],
      }}
   ;
or-expr:
   and-expr
 | or-expr '||' and-expr
      {$$ = yy.makeInfix($2, $1, $3)}
   ;

and-expr:
   comparison-expr
 | and-expr '&&' comparison-expr
      {$$ = yy.makeInfix($2, $1, $3)}
   ;

comparison-expr:
   add-expr
 | comparison-expr '<' add-expr
      {$$ = yy.makeInfix($2, $1, $3)}
 | comparison-expr '<=' add-expr
      {$$ = yy.makeInfix($2, $1, $3)}
 | comparison-expr '>' add-expr
      {$$ = yy.makeInfix($2, $1, $3)}
 | comparison-expr '>=' add-expr
      {$$ = yy.makeInfix($2, $1, $3)}
 | comparison-expr '=' add-expr
      {$$ = yy.makeInfix($2, $1, $3)}
 | comparison-expr '!=' add-expr
      {$$ = yy.makeInfix($2, $1, $3)}
   ;

add-expr:
   mult-expr
 | add-expr '+' mult-expr
      {$$ = yy.makeInfix($2, $1, $3)}
 | add-expr '-' mult-expr
      {$$ = yy.makeInfix($2, $1, $3)}
   ;

mult-expr:
   neg-expr
 | mult-expr '*' neg-expr
      {$$ = yy.makeInfix($2, $1, $3)}
 | mult-expr '/' neg-expr
      {$$ = yy.makeInfix($2, $1, $3)}
   ;

neg-expr:
   app-expr
 | '-' neg-expr
      {$$ = yy.makeUnary($1, $2)}
   ;

app-expr:
   val-expr
 | app-expr val-expr
      {$$ = {tokenName: 'APP', func: $1, arg: $2}}
   ;

val-expr:
 '(' expr ')'
      {$$ = $2}
 | id
 | INT_LITERAL
      {$$ = {tokenName: 'INT_LITERAL', val: Number(yytext)}}
 | FLOAT_LITERAL
      {$$ = {tokenName: 'FLOAT_LITERAL', val: Number(yytext)}}
 | BOOL_LITERAL
      {$$ = {tokenName: 'BOOL_LITERAL', val: yytext == 'true'}}
   ;

let-binding:
   id param-list '=' expr
      {$$ = {tokenName: 'BINDING', id: $1, params: $2, expr: $4}}
   ;

param-list:
   %empty
      {$$ = []}
 | id param-list
      {$$ = [...$2, $1]}
   ;

pattern: id {$$ = $1};

id: 'ident' {$$ = {tokenName: 'IDENTIFIER', id: $1}};
