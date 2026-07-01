type Props = {
  category: string;
  categories: string[];
  handleClickCategory: (category: string) => void;
};

export default function Categories({ category: c, categories, handleClickCategory }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {categories.map((category: string) => (
        <button
          key={category}
          type="button"
          className={`px-3.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
            category === c
              ? 'bg-green-0 text-white border-green-0'
              : 'bg-transparent text-grey-0 border-grey-3 hover:border-green-0 hover:text-green-0'
          }`}
          onClick={() => handleClickCategory(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
