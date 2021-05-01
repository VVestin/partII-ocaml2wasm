%lex

/*op-char ("!"|"$"|"%"|"&"|"*"|"+"|"-"|"."|"/"|":"|"<"|"="|">"|"?"|"@"|"^"|"|"|"~")*/
%%
\s+                        /* skip whitespace */
"-"?[0-9][0-9_]*("."[0-9_]+)(("e"|"E")("+"|"-")?[0-9][0-9_]*)?
                           return 'FLOAT_LITERAL';
"#"[0-9][0-9_]*            return 'NTH'
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
"fst"                      return 'NTH';
"snd"                      return 'NTH';
"match"                    return 'match';
"with"                     return 'with';
"|"                        return '|';
"type"                     return 'type';
"of"                       return 'of';
"int"                      return 'int';
"float"                    return 'float';
"bool"                     return 'bool';
"of"                       return 'of';
[a-zA-Z_][a-zA-Z_0-9']*    return 'ident';

/lex

/*%nonassoc 'in' 'fun'
%left '||'
%left '&&'
%right '<' '<=' '>' '>=' '=' '!='
%left '+' '-'
%left '*' '/'
%left UMINUS
%left APP*/

%left 'match'
%left '|'
%left ','

%start start

%%

start: stmt {return $1};

stmt:
   expr
   {$$ = {expr: $1, decls: []}}
 | type-decl stmt
   {$$ = {...$2, decls: [...$2.decls, $1]}}
   ;

expr:
   if-expr
 | 'fun' id '->' expr
      {$$ = {tokenName: 'FUNC', param: $2, body: $4}}
 | 'let' let-binding 'in' expr
      {$$ = {tokenName: 'LET', rec: false, binding: $2, body: $4}}
 | 'let' 'rec' let-binding 'in' expr
      {$$ = {tokenName: 'LET', rec: true, binding: $3, body: $5}}
 | 'match' expr 'with' pattern-matching
      {$$ = {tokenName: 'MATCH', expr: $2, clauses: $4}}
   ;

if-expr:
   tuple-expr
      {$$ = $1.exprs.length == 1 ? $1.exprs[0] : $1}
 | 'if' expr 'then' expr 'else' expr
      {$$ = {tokenName: 'IF', cond: $2, then: $4, else: $6}}
   ;

tuple-expr:
   or-expr
      {$$ = {tokenName: 'TUPLE', exprs: [$1]}}
 | tuple-expr ',' or-expr
      {$$ = {tokenName: 'TUPLE', exprs: [...$1.exprs, $3]}}
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
   unary-expr
 | mult-expr '*' unary-expr
      {$$ = yy.makeInfix($2, $1, $3)}
 | mult-expr '/' unary-expr
      {$$ = yy.makeInfix($2, $1, $3)}
   ;

unary-expr:
   app-expr
 | '-' unary-expr
      {$$ = yy.makeUnary($1, $2)}
 | 'NTH' unary-expr
      {const n = $1.startsWith('#')
         ? Number($1.slice(1))
         : {'fst': 1, 'snd': 2}[$1]
       $$ = {tokenName: 'UNARY_OP', op: 'NTH', n, operand: $2}}
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
 | constant
   ;

constant:
   INT_LITERAL
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

pattern-matching:
   pattern-matcher
      {$$ = [$1]}
 | pattern-matching '|' pattern-matcher
      {$$ = [...$1, $3]}
   ;

pattern-matcher:
   pattern '->' expr
      {$$ = {pattern: $1, expr: $3}}
   ;

pattern:
   tuple-pattern
      {$$ = ($1.exprs.length == 1) ? $1.exprs[0] : $1}
   ;

tuple-pattern:
   base-pattern
      {$$ = {tokenName: 'TUPLE', exprs: [$1]}}
 | tuple-pattern ',' pattern
      {$$ = { tokenName: 'TUPLE', exprs: [...$1.exprs, $3] }}
   ;

base-pattern:
   id
 | constant
 | '(' pattern ')'
   {$$ = $2}
   ;

id: 'ident' {$$ = {tokenName: 'IDENTIFIER', id: $1}};

type-decl:
   'type' id '=' constr-decls
      {$$ = {tokenName: 'TYPE_DECL', typeName: $2.id, constructors: $4}}
 ;

constr-decls:
   constr-decl
      {$$ = [$1]}
 | constr-decls '|' constr-decl
      {$$ = [...$1, $3]}
   ;

constr-decl:
   id
 | id 'of' type-expr
      {$$ = { constructor: $1, paramType: $3}}
   ;

type-expr:
   primitive-type
 | type-expr '*' primitive-type
   {$$ = {type: 'TUPLE', types: $1.type == 'TUPLE' ? [...$1.types, $3] : [$1, $3]}}
   ;

primitive-type:
   'int' {$$ = 'INT'}
 | 'float' {$$ = 'FLOAT'}
 | 'bool' {$$ = 'BOOL'}
 | id
 | '(' type-expr ')' {$$ = $2}
   ;
