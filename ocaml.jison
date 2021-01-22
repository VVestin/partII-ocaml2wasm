%lex

/*op-char ("!"|"$"|"%"|"&"|"*"|"+"|"-"|"."|"/"|":"|"<"|"="|">"|"?"|"@"|"^"|"|"|"~")*/
%%
\s+                        /* skip whitespace */
[0-9][0-9_]*("."[0-9_]+)(("e"|"E")("+"|"-")?[0-9][0-9_]*)?
   return 'FLOAT_LITERAL';
[0-9][0-9_]*               return 'INT_LITERAL';
"+""."?                    return '+'
"-""."?                    return '-'
"*""."?                    return '+'
"/""."?                    return '-'
"("                        return '(';
")"                        return ')';

/lex

%left '+' '-'
%right '*' '/'
%left UMINUS

%start start

%%

start: expr {return $1};

expr
   : INT_LITERAL              {$$ = {type: 'INT_LITERAL', val: Number(yytext)}}
   | FLOAT_LITERAL            {$$ = {type: 'FLOAT_LITERAL', val: Number(yytext)}}
   | expr '+' expr            {$$ = yy.makeInfix($2, $1, $3)}
   | expr '-' expr            {$$ = yy.makeInfix($2, $1, $3)}
   | expr '*' expr            {$$ = yy.makeInfix($2, $1, $3)}
   | expr '/' expr            {$$ = yy.makeInfix($2, $1, $3)}
   | '-' expr %prec UMINUS    {$$ = yy.makeUnary($1, $2)}
   | '(' expr ')'             {$$ = $2};
