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
%left APP
%left '||'
%left '&&'
%right '<' '<=' '>' '>=' '=' '!='
%left '+' '-'
%left '*' '/'
%left UMINUS

%start start

%%

start: expr {return $1};

expr
   : INT_LITERAL
      {$$ = {tokenName: 'INT_LITERAL', val: Number(yytext)}}
   | FLOAT_LITERAL
      {$$ = {tokenName: 'FLOAT_LITERAL', val: Number(yytext)}}
   | BOOL_LITERAL
      {$$ = {tokenName: 'BOOL_LITERAL', val: yytext == 'true'}}
   | '(' expr ')'                {$$ = $2}
   | expr '+' expr               {$$ = yy.makeInfix($2, $1, $3)}
   | expr '-' expr               {$$ = yy.makeInfix($2, $1, $3)}
   | expr '*' expr               {$$ = yy.makeInfix($2, $1, $3)}
   | expr '/' expr               {$$ = yy.makeInfix($2, $1, $3)}
   | expr '<' expr               {$$ = yy.makeInfix($2, $1, $3)}
   | expr '<=' expr              {$$ = yy.makeInfix($2, $1, $3)}
   | expr '>' expr               {$$ = yy.makeInfix($2, $1, $3)}
   | expr '>=' expr              {$$ = yy.makeInfix($2, $1, $3)}
   | expr '=' expr               {$$ = yy.makeInfix($2, $1, $3)}
   | expr '!=' expr              {$$ = yy.makeInfix($2, $1, $3)}
   | expr '&&' expr              {$$ = yy.makeInfix($2, $1, $3)}
   | expr '||' expr              {$$ = yy.makeInfix($2, $1, $3)}
   | '-' expr %prec UMINUS       {$$ = yy.makeUnary($1, $2)}


   | 'let' let-binding 'in' expr {$$ = {tokenName: 'LET', binding: $2, body: $4}}
   | id                          {$$ = $1}
   | 'fun' pattern '->' expr     {$$ = {tokenName: 'FUNC', param: $2, body: $4}}
   | expr expr %prec APP         {$$ = {tokenName: 'APP', func: $1, arg: $2}};


let-binding:
     pattern '=' expr {$$ = {tokenName: 'BINDING', lhs: $1, rhs: $3}};

pattern: id {$$ = $1};

id: 'ident' {$$ = {tokenName: 'IDENTIFIER', id: $1}};
