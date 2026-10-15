import { ApiService } from "@/services/api.service";
import { useQuery } from "@tanstack/react-query";
import ms from "ms";

export const useHolidays = () => {
  return useQuery({
    queryKey: ["holidays"],
    queryFn: async () => await ApiService.getHolidays(),
    staleTime: ms("1 day"),
  });
};
