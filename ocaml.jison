%lex

/*op-char ("!"|"$"|"%"|"&"|"*"|"+"|"-"|"."|"/"|":"|"<"|"="|">"|"?"|"@"|"^"|"|"|"~")*/
%%
\s+                        /* skip whitespace */
"-"?[0-9][0-9_]*("."[0-9_]+)(("e"|"E")("+"|"-")?[0-9][0-9_]*)?
                           return 'FLOAT_LITERAL';
"-"?[0-9][0-9_]*           return 'INT_LITERAL';
"true"|"false"             return 'BOOL_LITERAL'
"->"                       return '->';
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
"let"                      return 'let';
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
   or-expr
 | 'fun' pattern '->' expr
      {$$ = {tokenName: 'FUNC', param: $2, body: $4}}
 | 'let' let-binding 'in' expr
      {$$ = {tokenName: 'LET', binding: $2, body: $4}}
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
   mult-expr
 | comparison-expr '<' mult-expr
      {$$ = yy.makeInfix($2, $1, $3)}
 | comparison-expr '<=' mult-expr
      {$$ = yy.makeInfix($2, $1, $3)}
 | comparison-expr '>' mult-expr
      {$$ = yy.makeInfix($2, $1, $3)}
 | comparison-expr '>=' mult-expr
      {$$ = yy.makeInfix($2, $1, $3)}
 | comparison-expr '=' mult-expr
      {$$ = yy.makeInfix($2, $1, $3)}
 | comparison-expr '!=' mult-expr
      {$$ = yy.makeInfix($2, $1, $3)}
   ;

mult-expr:
   add-expr
 | mult-expr '*' add-expr
      {$$ = yy.makeInfix($2, $1, $3)}
 | mult-expr '/' add-expr
      {$$ = yy.makeInfix($2, $1, $3)}
   ;

add-expr:
   neg-expr
 | add-expr '+' neg-expr
      {$$ = yy.makeInfix($2, $1, $3)}
 | add-expr '-' neg-expr
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
   id
 | INT_LITERAL
      {$$ = {tokenName: 'INT_LITERAL', val: Number(yytext)}}
 | FLOAT_LITERAL
      {$$ = {tokenName: 'FLOAT_LITERAL', val: Number(yytext)}}
 | BOOL_LITERAL
      {$$ = {tokenName: 'BOOL_LITERAL', val: yytext == 'true'}}
 | '(' expr ')'
      {$$ = $2}
   ;

let-binding:
     pattern '=' expr {$$ = {tokenName: 'BINDING', lhs: $1, rhs: $3}};

pattern: id {$$ = $1};

id: 'ident' {$$ = {tokenName: 'IDENTIFIER', id: $1}};
