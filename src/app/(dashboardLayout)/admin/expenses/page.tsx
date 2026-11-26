/* eslint-disable @typescript-eslint/no-explicit-any */
import { getExpenseCategories, getExpenses, getFundSummary } from "@/service/expanses/expanses.service";
import ExpensesClient from "@/components/modules/expenses/ExpensesClient";

export const metadata = { title: "Expenses · Admin" };

const PAGE_SIZE = 10;

type SP = {
  page?: string;
  search?: string;
  status?: string;
  categoryId?: string;
  year?: string;
  month?: string;
};

export default async function AdminExpensesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const year = sp.year ? Number(sp.year) : new Date().getFullYear();
  const page = Math.max(1, Number(sp.page) || 1);

  const [summary, categories, expenses] = await Promise.all([
    getFundSummary(year),
    getExpenseCategories(true),
    getExpenses({
      page,
      limit: PAGE_SIZE,
      search: sp.search,
      status: sp.status as any,
      categoryId: sp.categoryId,
      // the table follows the year filter only when it is chosen explicitly
      year: sp.year,
      month: sp.month,
      sortBy: "spentAt",
      sortOrder: "desc",
    }),
  ]);

  return (
    <ExpensesClient
      year={year}
      summary={summary.success ? summary.data : null}
      categories={categories.success ? categories.data : []}
      expenses={expenses.success ? expenses.data : []}
      meta={expenses.success ? expenses.meta : null}
      filteredTotal={
        expenses.success ? (expenses.extra?.totalAmount ?? 0) : 0
      }
      loadError={
        !summary.success
          ? summary.message
          : !expenses.success
            ? expenses.message
            : null
      }
    />
  );
}