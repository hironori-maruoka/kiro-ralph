# Excel Lite - Quick Start Guide

## 🚀 Getting Started

### Installation
```bash
cd excel-lite
npm install
```

### Run Development Server
```bash
npm run dev
```
Then open http://localhost:5173 in your browser.

### Run Tests
```bash
npm run test
```

## 📖 User Guide

### Basic Operations

#### Selecting Cells
- **Click** on any cell to select it
- Use **Arrow Keys** (↑ ↓ ← →) to navigate between cells
- Selected cell is highlighted with a blue border

#### Editing Cells
- **Double-click** a cell to enter edit mode
- Or select a cell and press **Enter**
- Type your content (text, numbers, or formulas)
- Press **Enter** to save changes
- Press **Escape** to cancel editing

#### Entering Formulas
All formulas must start with `=`

**Examples:**
```
=5+3              → 8
=A1+B1            → Sum of cells A1 and B1
=A1*2             → Double the value in A1
=(A1+B1)/2        → Average of A1 and B1
=SUM(A1:A5)       → Sum of range A1 to A5
=AVG(B1:B10)      → Average of range B1 to B10
```

### Supported Operations

#### Arithmetic Operators
- `+` Addition
- `-` Subtraction
- `*` Multiplication
- `/` Division

#### Functions
- `SUM(range)` - Sum all numbers in a range
- `AVG(range)` - Average of all numbers in a range

#### Cell References
- Single cell: `A1`, `B2`, `J20`
- Range: `A1:A5`, `B1:D10`

### Error Messages

- `#ERR` - Syntax error, invalid reference, or division by zero
- `#CYC` - Circular reference detected

## 🎯 Example Scenarios

### Scenario 1: Simple Budget
```
A1: 100        (Income)
A2: 30         (Expense 1)
A3: 20         (Expense 2)
A4: =A1-A2-A3  (Remaining: 50)
```

### Scenario 2: Grade Calculator
```
A1: 85         (Test 1)
A2: 90         (Test 2)
A3: 78         (Test 3)
A4: =AVG(A1:A3) (Average: 84.33)
```

### Scenario 3: Sales Report
```
A1: 100        (Product A sales)
A2: 150        (Product B sales)
A3: 200        (Product C sales)
B1: =A1*1.1    (Product A with 10% tax)
B2: =A2*1.1    (Product B with 10% tax)
B3: =A3*1.1    (Product C with 10% tax)
B4: =SUM(B1:B3) (Total with tax: 495)
```

### Scenario 4: Automatic Recalculation
```
A1: 10
B1: =A1*2      (Shows: 20)
C1: =B1+5      (Shows: 25)

Now change A1 to 20:
B1: =A1*2      (Automatically updates to: 40)
C1: =B1+5      (Automatically updates to: 45)
```

### Scenario 5: Circular Reference (Error)
```
A1: =B1        
B1: =A1        (Both show: #CYC)
```

## 🎨 UI Features

- **10 columns** (A-J) and **20 rows** (1-20)
- **Column headers** at the top
- **Row headers** on the left
- **Selected cell** highlighted in blue
- **Error cells** displayed in red
- **Hover effects** for better UX
- **Keyboard navigation** for efficiency

## 🔧 Technical Details

### Architecture
- **Engine Layer**: Pure TypeScript logic (UI-independent)
- **UI Layer**: React components with Tailwind CSS
- **State Management**: Custom React hooks
- **Testing**: Vitest with property-based testing (fast-check)

### Key Features
- ✅ Real-time formula evaluation
- ✅ Automatic dependency tracking
- ✅ Circular reference detection
- ✅ Topological sorting for correct recalculation order
- ✅ Error propagation
- ✅ Keyboard navigation
- ✅ Clean, minimal UI

## 📚 For Developers

### Running Tests
```bash
npm run test              # All tests
npm run test:unit         # Unit tests only
npm run test:property     # Property-based tests only
npm run test:coverage     # With coverage report
```

### Building for Production
```bash
npm run build
```
Output will be in the `dist/` directory.

### Project Structure
- `src/engine/` - Core calculation logic
- `src/components/` - React UI components
- `src/hooks/` - Custom React hooks
- `tests/` - All test files

### Adding New Features

To add a new function (e.g., MAX):

1. Update `ASTNode` type in `src/engine/types.ts`
2. Add parsing logic in `src/engine/parser.ts`
3. Add evaluation logic in `src/engine/evaluator.ts`
4. Add tests in `tests/engine/`

## 🐛 Troubleshooting

**Q: Formula not calculating?**
- Make sure it starts with `=`
- Check for syntax errors
- Verify cell references are valid (A1-J20)

**Q: Getting #CYC error?**
- You have a circular reference
- Check if cells reference each other in a loop
- Break the cycle by changing one of the formulas

**Q: Getting #ERR error?**
- Check formula syntax
- Verify cell references exist
- Check for division by zero

## 📞 Support

For issues or questions, refer to:
- `PROJECT_COMPLETE.md` - Full project documentation
- `tests/` directory - Example usage in tests
- Source code comments

---

**Enjoy using Excel Lite!** 🎉
