import './CategoryFilter.css';

function CategoryFilter({ categories, activeCategory, onSelectCategory }) {
  return (
    <div className="category-filter">
      {categories.map((category) => ( // creates one button per item in the array
        <button
          key={category} // using the category name itself rather than the index as each name is unique and stable
          className="btn"
          aria-pressed={category === activeCategory} // evaluates to true only for the button whose name matches the activeCategory and false for everything else
          onClick={() => onSelectCategory(category)} // captures this specific category from the current loop iteration so clicking any button reports the right value back up
        >
          {category}
        </button> // creates one button per category listed in the array
      ))}
    </div>
  );
}

export default CategoryFilter;