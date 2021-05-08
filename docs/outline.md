# Compiling OCaml to WebAssembly
## Introduction
(notes):
- Clearly explain the problem
   - Why is the problem interesting
   - What does the solution enable?
- Describe what I've built
   - Explain how it solves the problem
   - Leave details for the implementation

- JavaScript is weird (dynamic types, unusual prototype-based inheritance, event loop paradigm)
- The web is an important platform for enterprise projects and would benefit from paradigms and techniques besides JS
- OCaml is well suited to software engineering, strong and provably sound type system
- WebAssembly has exciting performance and safety properties that JS lacks, can totally be a target for an OCaml compiler
- Running OCaml on the Web would enable cool things including better performance
- Description of what I've built and how it aims to solve the problem

## Preparation
(notes):
- Explain background knowledge needed
   - Rule of thumb: explain things outside of 1B
   - Explain things needed to make sense of decisions later
- Requirements analysis
   - Techniques and tools that could be used
   - What did I decide to use
   - What factors lead to these techniques
- Engineering practices that were followed
   - What are standard practice: validation & source control
   - How does what I did compare to standard practice

### Background
- [x] How does webassembly work
    - [x] JIT compiling JS and the V8 Engine
    - [x] Overview of what WebAssembly is
    - [x] Stack Machine w/ heap and 2/4 basic types
    - [x] Talk about the important features of wasm for reference in the implementation chapter
    - [ ] WebAssembly Binary Toolkit use
- [x] Talk about decision to use JavaScript
   - [x] Running in Node/browsers possibilities
- [x] Talk about ocamllex and ocamlyacc and jison
- [x] NOT NEEDED CAN DESCRIBE BRIEFLY IN EVALUATION: Alternatives to using the ocaml compiler (ocaml to js, vanilla js) for reference in evaluation chapter
### Requirements
- [x] Description of OCaml subset
- [x] Development of sample programs
- [x] NOT NEEDED: Setup tools for automated testing
- [ ] TODO AFTER EVALUATION: Benchmarking for evaluation
### Engineering
- [x] Iterative Development (instead of waterfall)
- [x] Test Driven Development
- [x] Kanban organizational technique
- [x] Source control/backup tools

## Implementation
(notes):
- Explain the project itself
    - Describe repository layout
    - Design and methodology
    - Explain it as if they're a new hire
- How did the methods from the preparation apply to the project
- What did I try that didn't work?
- What was achieved, what does it do
    - Explain the limitations (gosh, there's a lot)

### Repository Overview
- Pipeline Overview
- The file structure
    - 5 important js files
    - tests
    - tests/samples/
    - package.json
    - docs
    - dist
    - app.js
### Parsing
- [x] The general grammar
   - [x] ambiguous expr v1
   - [x] Juxtaposition Operator
### Code Transformations
- [x] Match Transformation
- [x] Let Transformation
### Type Checking/Inference
- [x] What is the Wand algorithm
    - [x] Annotate
    - [x] Constrain
    - [x] Solve
- [x] Dealing with polymorphism
- [ ] TODO: NOT NEEDED? Tuple projection operator
### Code Generation
-[x] comp() signature explanation
- [x] runtime environment
   - [x] heap allocation
   - [x] funcref table
   - [ ] error function
- [x] Closures, environments
- [x] recursive functions
### Main
- Glues together the pipeline
- Executing the webassembly
- Pretty-printing
- Value extraction

## Evaluation
(notes):
- Explain evaluation methods
    - Quantitative and qualitative results
- Give the results
- Compare with the success criteria
- Interpret what the results teach us

## Conclusion
(notes):
- What have you learned
- What would you do differently if done again
- What advice would I have for others doing this project

- Discuss the success criteria
- What did I learn from this project
- What would I do differently if doing project again
